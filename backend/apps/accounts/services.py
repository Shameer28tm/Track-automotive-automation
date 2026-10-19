import logging
import firebase_admin
from firebase_admin import auth as firebase_auth, exceptions as firebase_exceptions
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from google.auth.exceptions import GoogleAuthError
from django.conf import settings

logger = logging.getLogger(__name__)


class AuthenticationVerificationError(Exception):
    """Raised when server-side cryptographic token verification fails."""
    pass


def _has_firebase_credentials():
    """Checks if explicit Firebase service account credentials are provided."""
    import os
    return bool(os.getenv('GOOGLE_APPLICATION_CREDENTIALS') or getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None))


def _get_or_init_firebase_app():
    """Initializes or retrieves the Firebase Admin app if credentials are configured."""
    import os
    if not _has_firebase_credentials():
        return None
    project_id = getattr(settings, 'FIREBASE_PROJECT_ID', 'track-automotive')
    cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None) or os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if not firebase_admin._apps:
        try:
            cred = firebase_admin.credentials.Certificate(cred_path) if cred_path and os.path.exists(cred_path) else None
            return firebase_admin.initialize_app(cred, options={'projectId': project_id})
        except Exception as e:
            logger.debug(f"Firebase Admin app init note: {e}")
            return None
    return firebase_admin.get_app()


def verify_google_or_firebase_token(token: str) -> dict:
    """
    Cryptographically validates a Google or Firebase ID token server-side.

    Validates:
      1. Cryptographic RSA signature against Google's authoritative public certificates
      2. Token expiration (exp) and issue time (iat)
      3. Audience (aud) matching the configured Firebase Project ID or Google Client ID
      4. Issuer (iss) matching official Google/Firebase security endpoints
      5. Email verification status (email_verified must strictly be True)

    Returns:
        dict: Verified claims containing 'email', 'name', 'picture', and 'sub'.
    Raises:
        AuthenticationVerificationError: If token is missing, invalid, expired, forged,
                                         issued for the wrong project, or unverified.
    """
    if not token or not isinstance(token, str):
        raise AuthenticationVerificationError("Authentication token is required.")

    token = token.strip()
    if not token:
        raise AuthenticationVerificationError("Authentication token cannot be blank.")

    firebase_project_id = getattr(settings, 'FIREBASE_PROJECT_ID', 'track-automotive')
    google_client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
    expected_firebase_issuer = f"https://securetoken.google.com/{firebase_project_id}"

    claims = None
    verification_errors = []

    # 1. Primary verification: Google's official server-side verify_firebase_token
    # Validates RS256 signature against Google's public certs, expiration, and project audience
    try:
        req = google_requests.Request()
        claims = google_id_token.verify_firebase_token(
            token,
            req,
            audience=firebase_project_id
        )
    except (GoogleAuthError, ValueError) as e:
        verification_errors.append(f"Google Firebase token verifier: {str(e)}")
    except Exception as e:
        verification_errors.append(f"Google Firebase token verifier: {str(e)}")

    # 2. Secondary verification via Firebase Admin SDK if service credentials are provided
    if not claims and _has_firebase_credentials():
        try:
            app = _get_or_init_firebase_app()
            if app:
                claims = firebase_auth.verify_id_token(token, app=app, check_revoked=False)
        except firebase_exceptions.FirebaseError as e:
            verification_errors.append(f"Firebase Admin: {str(e)}")
        except Exception as e:
            verification_errors.append(f"Firebase Admin: {str(e)}")

    # 3. If not a Firebase token, attempt verification as standard Google OAuth2 ID token
    # ONLY if a specific non-empty GOOGLE_CLIENT_ID is configured
    if not claims and google_client_id:
        try:
            req = google_requests.Request()
            claims = google_id_token.verify_oauth2_token(
                token,
                req,
                audience=google_client_id
            )
            if claims:
                expected_google_issuers = ['accounts.google.com', 'https://accounts.google.com']
                if claims.get('iss') not in expected_google_issuers:
                    claims = None
                    verification_errors.append("Invalid Google OAuth issuer.")
        except (GoogleAuthError, ValueError) as e:
            verification_errors.append(f"Google OAuth2 verifier: {str(e)}")
        except Exception as e:
            verification_errors.append(f"Google OAuth2 verifier: {str(e)}")

    # Reject if no trusted verification provider accepted the token
    if not claims:
        logger.warning("Token cryptographic verification failed: %s", " | ".join(verification_errors))
        # Provide clean, actionable message to client
        if any("expired" in err.lower() for err in verification_errors):
            raise AuthenticationVerificationError("Authentication token has expired. Please sign in again.")
        elif any("audience" in err.lower() or "wrong project" in err.lower() for err in verification_errors):
            raise AuthenticationVerificationError("Token was issued for an unauthorized project or audience.")
        else:
            raise AuthenticationVerificationError("Invalid or forged authentication token signature.")

    # 4. Enforce strict audience check for Firebase tokens
    if claims.get('iss') == expected_firebase_issuer:
        if claims.get('aud') != firebase_project_id:
            raise AuthenticationVerificationError("Token audience does not match configured Firebase project.")
    elif claims.get('iss') and 'securetoken.google.com' in claims.get('iss'):
        # Token from another Firebase project
        if claims.get('iss') != expected_firebase_issuer or claims.get('aud') != firebase_project_id:
            raise AuthenticationVerificationError("Token was issued for an unauthorized Firebase project.")

    # 5. Strict verification of email status
    if claims.get('email_verified') is not True:
        raise AuthenticationVerificationError("The email address linked to this Google/Firebase account is not verified.")

    email = claims.get('email')
    if not email:
        raise AuthenticationVerificationError("Token does not contain a valid email address.")

    sub = claims.get('sub') or claims.get('user_id')
    if not sub:
        raise AuthenticationVerificationError("Token does not contain a subject identifier (sub).")

    return {
        'email': email.lower().strip(),
        'name': claims.get('name') or email.split('@')[0],
        'picture': claims.get('picture') or claims.get('photo_url') or '',
        'sub': str(sub),
    }
