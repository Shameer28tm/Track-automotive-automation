import React, { useState, useEffect } from 'react';
import { Car, Plus, Search, Edit2, Trash2, CalendarCheck, AlertTriangle, Fuel, Gauge } from 'lucide-react';
import { vehiclesApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import VehicleModal from './VehicleModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';

export const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const { user, isAdmin } = useAuth();

  const loadVehicles = async (query = search) => {
    setLoading(true);
    try {
      const res = await vehiclesApi.list({ search: query });
      setVehicles(res.data.results || res.data || []);
    } catch (err) {
      console.error("Failed to load vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadVehicles(search);
  };

  const handleDelete = async (vehicle) => {
    if (window.confirm(`Are you sure you want to delete vehicle ${vehicle.license_plate} (${vehicle.make} ${vehicle.model})?`)) {
      try {
        await vehiclesApi.delete(vehicle.id);
        loadVehicles();
      } catch (err) {
        alert("Failed to delete vehicle: " + (err.response?.data?.detail || err.message));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Garage Vehicles</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin ? 'Manage all client cars, chassis specifications, and service history' : 'Manage your registered vehicles for service booking'}
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedVehicle(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Register Vehicle</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by registration plate, make, model, chassis, or owner..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20"><LoadingSpinner size="lg" /></div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No vehicles found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? 'No vehicles match your search query.' : 'Register your first car to begin booking services and tracking repairs.'}
          </p>
          <button
            onClick={() => {
              setSelectedVehicle(null);
              setIsModalOpen(true);
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Register Vehicle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                      {v.license_plate}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-2">
                      {v.year} {v.make} {v.model}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedVehicle(v);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit vehicle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {(isAdmin || v.owner === user.id) && (
                      <button
                        onClick={() => handleDelete(v)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete vehicle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mt-4">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5" /> Mileage:
                    </span>
                    <span className="font-medium text-slate-800">{v.current_mileage?.toLocaleString()} km</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5" /> Fuel & Type:
                    </span>
                    <span className="font-medium text-slate-800 capitalize">{v.fuel_type?.toLowerCase()} • {v.vehicle_type?.toLowerCase()}</span>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Owner:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[150px]">{v.owner_name || v.owner_email}</span>
                    </div>
                  )}
                  {v.chassis_number && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Chassis / VIN:</span>
                      <span className="font-mono text-[11px] text-slate-700">{v.chassis_number}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <Link
                  to={`/appointments`}
                  className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Book Service</span>
                </Link>
                <Link
                  to={`/faults`}
                  className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Report Fault</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vehicle={selectedVehicle}
        onSaved={loadVehicles}
      />
    </div>
  );
};

export default VehiclesPage;
