const Service = require('../models/Service');

// Create a new service
exports.createService = async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Nombre y precio son obligatorios' });
    }
    const service = await Service.create({ name, price });
    res.status(201).json({ message: 'Servicio creado', service });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear servicio' });
  }
};

// Get all services
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.findAll({ order: [['name', 'ASC']] });
    res.status(200).json(services);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
};

// Update a service
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;
    const service = await Service.findByPk(id);
    if (!service) return res.status(404).json({ error: 'Servicio no encontrado' });
    if (name) service.name = name;
    if (price !== undefined) service.price = price;
    await service.save();
    res.json({ message: 'Servicio actualizado', service });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
};

// Delete a service
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Service.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json({ message: 'Servicio eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar servicio' });
  }
};
