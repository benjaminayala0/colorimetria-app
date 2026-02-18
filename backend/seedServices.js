const sequelize = require('./database/db');
const Service = require('./models/Service');

async function seedServices() {
    try {
        await sequelize.sync();

        const services = [
            { name: 'Color', price: 15000 },
            { name: 'Nutrición', price: 8000 },
            { name: 'Mechitas', price: 12000 },
            { name: 'Balayage', price: 18000 }
        ];

        for (const service of services) {
            await Service.findOrCreate({
                where: { name: service.name },
                defaults: service
            });
        }

        console.log('✅ Services added successfully!');
        console.log('Services:', await Service.findAll());
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding services:', error);
        process.exit(1);
    }
}

seedServices();
