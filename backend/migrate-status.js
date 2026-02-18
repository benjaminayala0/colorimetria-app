const sequelize = require('./database/db');

async function migrateStatus() {
    try {
        console.log('🔄 Starting migration: Adding status column to Appointments table...');

        // Try to add status column - will fail if it already exists
        try {
            await sequelize.query(`
                ALTER TABLE Appointments 
                ADD COLUMN status VARCHAR(255) DEFAULT 'pending';
            `);
            console.log('✅ Status column added successfully!');
        } catch (error) {
            if (error.message && error.message.includes('duplicate column name')) {
                console.log('✅ Status column already exists. Skipping column creation.');
            } else {
                throw error;
            }
        }

        // Get current date and time in Argentina timezone
        const now = new Date();
        const argentinaTime = new Date(now.toLocaleString('en-US', {
            timeZone: 'America/Argentina/Buenos_Aires'
        }));

        const year = argentinaTime.getFullYear();
        const month = String(argentinaTime.getMonth() + 1).padStart(2, '0');
        const day = String(argentinaTime.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;

        const hours = String(argentinaTime.getHours()).padStart(2, '0');
        const minutes = String(argentinaTime.getMinutes()).padStart(2, '0');
        const currentTime = `${hours}:${minutes}`;

        console.log(`📅 Current date: ${todayString}, time: ${currentTime}`);

        // Set all NULL status values to 'pending'
        await sequelize.query(`
            UPDATE Appointments 
            SET status = 'pending'
            WHERE status IS NULL;
        `);

        console.log('✅ All appointments with NULL status set to "pending"');
        console.log('📝 You can now manually mark appointments as completed/absent/cancelled');
        console.log('');
        console.log('🎉 Migration completed successfully!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Restart your backend server (Ctrl+C and npm run dev)');
        console.log('2. Test marking appointments with different statuses in the agenda');
        console.log('3. Verify revenue calculations only count completed appointments');

        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateStatus();
