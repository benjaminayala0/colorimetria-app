const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const revenueController = require('../controllers/revenueController');
const db = require('../database/db');

router.get('/dashboard/summary', appointmentController.getDashboardSummary);
router.get('/revenue/stats', revenueController.getRevenueStats);

// Create a new appointment
router.post('/', appointmentController.createAppointment);

// Get all appointments
router.get('/', appointmentController.getAllAppointments);

// Get appointments by date
router.get('/date/:date', appointmentController.getAppointmentsByDate);

// Update an appointment
router.put('/:id', appointmentController.updateAppointment);

// Delete an appointment
router.delete('/:id', appointmentController.deleteAppointment);


module.exports = router;
