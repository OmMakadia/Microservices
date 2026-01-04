import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

const SalonBookings = () => {
  const { salonId } = useParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [salonId, filterDate]);

  const fetchBookings = async () => {
    try {
      const params = {};
      if (filterDate) params.date = filterDate;

      const response = await api.get(`/api/v1/bookings/salon/${salonId}`, { params });
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading bookings...</div>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Salon Bookings</h1>
        <input
          type="date"
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No bookings found for this salon.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Booking #{booking.id}
                  </h3>
                  <p className="text-gray-600">
                    Customer ID: {booking.customer_id}
                  </p>
                  <p className="text-gray-600">
                    {new Date(booking.booking_date).toLocaleDateString()} at{' '}
                    {booking.booking_time.substring(0, 5)}
                  </p>
                  <p className="text-gray-900 font-semibold mt-2">
                    Total: ${parseFloat(booking.total_amount).toFixed(2)}
                  </p>
                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              </div>
              {booking.items && booking.items.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Services:</h4>
                  <ul className="list-disc list-inside">
                    {booking.items.map((item, index) => (
                      <li key={index} className="text-gray-600">
                        {item.service_name} - ${parseFloat(item.price).toFixed(2)} ({item.duration_minutes} min)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SalonBookings;

