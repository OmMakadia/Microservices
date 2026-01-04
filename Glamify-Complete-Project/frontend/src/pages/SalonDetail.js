import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const SalonDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [salon, setSalon] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchSalon();
  }, [id]);

  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedService]);

  const fetchSalon = async () => {
    try {
      const response = await api.get(`/api/v1/salons/${id}`);
      setSalon(response.data);
    } catch (error) {
      console.error('Error fetching salon:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await api.get('/api/v1/availability/slots', {
        params: {
          salonId: id,
          date: selectedDate,
          serviceId: selectedService
        }
      });
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!selectedService || !selectedSlot || !selectedDate) {
      alert('Please select a service, date, and time slot');
      return;
    }

    setBooking(true);
    try {
      // Lock the slot first
      await api.post(`/api/v1/availability/slots/${selectedSlot.id}/lock`, {
        durationMinutes: 5
      });

      // Create booking
      const response = await api.post('/api/v1/bookings', {
        salonId: id,
        slotId: selectedSlot.id,
        serviceIds: [selectedService],
        notes: ''
      });

      alert('Booking confirmed!');
      navigate('/bookings');
    } catch (error) {
      alert(error.response?.data?.error || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!salon) {
    return <div className="text-center py-12">Salon not found</div>;
  }

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          {salon.image_url && (
            <div className="md:w-1/2">
              <img
                src={salon.image_url}
                alt={salon.name}
                className="w-full h-64 md:h-full object-cover"
              />
            </div>
          )}
          <div className="p-8 md:w-1/2">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{salon.name}</h1>
            <p className="text-gray-600 mb-4">{salon.description}</p>
            <div className="mb-4">
              <p className="text-gray-700">
                <strong>Address:</strong> {salon.address}, {salon.city}, {salon.state} {salon.zip_code}
              </p>
              {salon.phone && <p className="text-gray-700"><strong>Phone:</strong> {salon.phone}</p>}
              {salon.email && <p className="text-gray-700"><strong>Email:</strong> {salon.email}</p>}
            </div>
            {salon.rating > 0 && (
              <div className="flex items-center mb-4">
                <span className="text-yellow-400">⭐</span>
                <span className="ml-1 text-gray-700">{salon.rating.toFixed(1)}</span>
                <span className="ml-1 text-gray-500">({salon.total_reviews} reviews)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Book an Appointment</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Service
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
              value={selectedService || ''}
              onChange={(e) => setSelectedService(e.target.value)}
            >
              <option value="">Choose a service</option>
              {salon.services?.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - ${service.price} ({service.duration_minutes} min)
                </option>
              ))}
            </select>
          </div>

          {selectedService && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  min={minDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              {selectedDate && availableSlots.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Time
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-4 py-2 rounded-md border ${
                          selectedSlot?.id === slot.id
                            ? 'bg-pink-600 text-white border-pink-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-pink-500'
                        }`}
                      >
                        {slot.slot_time.substring(0, 5)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDate && availableSlots.length === 0 && (
                <div className="text-gray-500">No available slots for this date</div>
              )}

              {selectedSlot && (
                <button
                  onClick={handleBooking}
                  disabled={booking}
                  className="w-full bg-pink-600 text-white px-6 py-3 rounded-md hover:bg-pink-700 disabled:opacity-50"
                >
                  {booking ? 'Booking...' : 'Book Appointment'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalonDetail;

