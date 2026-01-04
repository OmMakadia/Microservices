import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/api/v1/bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await api.post(`/api/v1/bookings/${bookingId}/cancel`);
      fetchBookings();
      alert('Booking cancelled successfully');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to cancel booking');
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          You don't have any bookings yet.
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
                    {new Date(booking.booking_date).toLocaleDateString()} at{' '}
                    {booking.booking_time.substring(0, 5)}
                  </p>
                  <p className="text-gray-600">Salon ID: {booking.salon_id}</p>
                  <p className="text-gray-900 font-semibold mt-2">
                    Total: ${parseFloat(booking.total_amount).toFixed(2)}
                  </p>
                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
                {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Cancel
                  </button>
                )}
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

export default BookingHistory;

