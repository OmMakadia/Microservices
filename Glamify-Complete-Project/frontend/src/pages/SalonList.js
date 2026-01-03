import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const SalonList = () => {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    fetchSalons();
  }, [search, city]);

  const fetchSalons = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (city) params.city = city;

      const response = await api.get('/api/v1/salons', { params });
      setSalons(response.data);
    } catch (error) {
      console.error('Error fetching salons:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading salons...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Find a Salon</h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search salons..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            type="text"
            placeholder="City"
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {salons.map((salon) => (
          <Link
            key={salon.id}
            to={`/salons/${salon.id}`}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {salon.image_url && (
              <img
                src={salon.image_url}
                alt={salon.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{salon.name}</h3>
              <p className="text-gray-600 mb-2">{salon.city}, {salon.state}</p>
              {salon.rating > 0 && (
                <div className="flex items-center">
                  <span className="text-yellow-400">⭐</span>
                  <span className="ml-1 text-gray-700">{salon.rating.toFixed(1)}</span>
                  <span className="ml-1 text-gray-500">({salon.total_reviews} reviews)</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {salons.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No salons found. Try adjusting your search.
        </div>
      )}
    </div>
  );
};

export default SalonList;

