module.exports = {
    up: async (queryInterface, Sequelize, models) => {
        // Create test backup for E2E and API tests
        // Using deterministic label '24fb8bb550' that matches JURIDICTION_TEST_NAME constant
        const testBackupLabel = '24fb8bb550';
        const existingBackup = await models.HRBackups.findOne({
            where: { label: testBackupLabel },
        });

        if (!existingBackup) {
            // Find a juridiction to associate with the backup
            const juridiction = await models.TJ.findOne();

            if (!juridiction) {
                console.log('[SEEDER] No juridiction found, creating a test juridiction first');
                // Create a minimal juridiction if none exists
                await queryInterface.bulkInsert('TJ', [{
                    label: 'Test Juridiction',
                    created_at: new Date(),
                    updated_at: new Date(),
                }]);
            }

            const juridictionId = juridiction ? juridiction.id : 1;

            await queryInterface.bulkInsert('HRBackups', [{
                label: testBackupLabel,
                date_start: new Date('2024-01-01'),
                date_stop: new Date('2026-12-31'),
                juridiction_id: juridictionId,
                created_at: new Date(),
                updated_at: new Date(),
            }]);

            console.log(`[SEEDER] Created ${testBackupLabel} backup for E2E and API tests`);
        } else {
            console.log(`[SEEDER] ${testBackupLabel} backup already exists`);
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('HRBackups', { label: '24fb8bb550' }, {});
    },
};
