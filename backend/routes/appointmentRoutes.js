const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const revenueController = require('../controllers/revenueController');
const agendaController = require('../controllers/agendaController');
const db = require('../database/db');

router.get('/dashboard/summary', appointmentController.getDashboardSummary);
router.get('/revenue/stats', revenueController.getRevenueStats);
router.get('/today', agendaController.getTodayAgenda);

// Create a new appointment
router.post('/', appointmentController.createAppointment);

// Get all appointments
router.get('/', appointmentController.getAllAppointments);

// Get appointments by date
router.get('/date/:date', appointmentController.getAppointmentsByDate);

// Update an appointment
router.put('/:id', appointmentController.updateAppointment);

// Update appointment status
router.patch('/:id/status', appointmentController.updateAppointmentStatus);

// Delete an appointment
router.delete('/:id', appointmentController.deleteAppointment);


module.exports = router;
