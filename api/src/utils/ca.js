import config from 'config';

/**
 * Vérification du type d'interface
 * @returns booleen true si CA false sinon
 */
export const isCa = () => {
    if (Number(config.juridictionType) === 1) return true
    else return false
}
