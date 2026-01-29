
/**
 * Test credentials for GREEN HANDS app
 * 
 * TEAM LEADER / ADMIN:
 * Email: contact@thegreenhands.fr
 * Password: Lagrandeteam13
 * 
 * DRIVER (Phone-based login):
 * Phone: +33612345678
 * Name: Jean Dupont
 * 
 * Note: Drivers must be created and approved by a team leader before they can log in.
 * Use the team leader account to create and approve drivers.
 */

export const TEST_CREDENTIALS = {
  teamLeader: {
    email: 'contact@thegreenhands.fr',
    password: 'Lagrandeteam13',
  },
  driver: {
    phone: '+33612345678',
    firstName: 'Jean',
    lastName: 'Dupont',
  },
};

export const SAMPLE_DRIVERS = [
  {
    phone: '+33612345678',
    firstName: 'Jean',
    lastName: 'Dupont',
  },
  {
    phone: '+33698765432',
    firstName: 'Marie',
    lastName: 'Martin',
  },
  {
    phone: '+33687654321',
    firstName: 'Pierre',
    lastName: 'Bernard',
  },
];
