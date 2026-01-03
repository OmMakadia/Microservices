import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const SalonOwnerDashboard = () => {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMySalons();
  }, []);

  const fetchMySalons = async () => {
    try {
      const response = await api.get('/api/v1/salons/owner/my-salons');
      setSalons(response.data);
    } catch (error) {
      console.error('Error fetching salons:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Salons</h1>
        <Link
          to="/owner/create-salon"
          className="bg-pink-600 text-white px-6 py-2 rounded-md hover:bg-pink-700"
        >
          Create New Salon
        </Link>
      </div>

      {salons.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">You don't have any salons yet.</p>
          <Link
            to="/owner/create-salon"
            className="bg-pink-600 text-white px-6 py-2 rounded-md hover:bg-pink-700 inline-block"
          >
            Create Your First Salon
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {salons.map((salon) => (
            <div key={salon.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {salon.image_url && (
                <img
                  src={salon.image_url}
                  alt={salon.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{salon.name}</h3>
                <p className="text-gray-600 mb-4">{salon.city}, {salon.state}</p>
                <div className="flex space-x-2">
                  <Link
                    to={`/owner/salon/${salon.id}/bookings`}
                    className="flex-1 bg-pink-600 text-white text-center px-4 py-2 rounded-md hover:bg-pink-700"
                  >
                    View Bookings
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SalonOwnerDashboard;

