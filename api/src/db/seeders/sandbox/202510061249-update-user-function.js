const { Op } = require('sequelize')
const { isTj } = require('../../../utils/ca')

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isTj()) {
      const list = [
        {
          label: 'Chargé(e) de mission',
          idAgents: [37, 259, 17, 132, 173, 197, 227, 196, 224, 53, 60, 67],
        },
        {
          label: 'Chef(fe) de cabinet',
          idAgents: [179, 91],
        },
        {
          label: 'Directeur/trice de greffe',
          idAgents: [
            42, 163, 167, 90, 98, 52, 113, 154, 117, 96, 24, 59, 122, 74, 29, 107, 119, 123, 145, 180, 161, 207, 252, 233, 234, 260, 239, 243, 249, 251, 263,
            271, 267, 273, 301, 272, 275, 304, 298, 282, 280, 297, 166, 253, 274, 109, 120, 72, 97, 184, 146, 76,
          ],
        },
        {
          label: 'Directeur/trice de greffe adjoint(e)',
          idAgents: [30, 111, 287, 158, 129, 264, 235, 244, 262, 305, 104],
        },
        {
          label: 'Directeur/trice des services de greffe judiciaires',
          idAgents: [
            183, 159, 115, 94, 105, 293, 124, 294, 34, 112, 133, 288, 140, 138, 135, 139, 131, 192, 193, 216, 247, 232, 229, 254, 255, 128, 296, 250, 95, 286,
            114, 99, 191, 653, 110, 242, 736, 789, 322, 290,
          ],
        },
        {
          label: 'Président(e)',
          idAgents: [
            168, 174, 175, 48, 81, 89, 86, 80, 83, 142, 147, 101, 176, 88, 169, 84, 82, 186, 87, 181, 54, 102, 50, 15, 108, 162, 62, 116, 14, 28, 77, 31, 126,
            73, 144, 165, 150, 143, 130, 170, 149, 85, 187, 289, 203, 209, 194, 217, 199, 223, 204, 200, 208, 205, 218, 219, 210, 241, 265, 238, 240, 41, 245,
            256, 307, 281, 302, 300, 270, 306, 279, 276, 283, 269, 303, 266, 246, 47, 49, 268, 292, 185, 237, 222, 58, 299, 214, 213, 206,
          ],
        },
        {
          label: 'Secrétaire administratif - DG',
          idAgents: [61, 125, 397, 365, 137],
        },
        {
          label: 'Secrétaire administratif - présidence',
          idAgents: [118, 43, 257, 258, 793, 609, 148, 100, 152, 78, 432, 749],
        },
        {
          label: 'Secrétaire général(e)',
          idAgents: [103, 141, 7, 63, 134, 190, 27, 79],
        },
      ]

      for (let i = 0; i < list.length; i++) {
        const item = list[i]
        for (let j = 0; j < item.idAgents.length; j++) {
          const findUser = await models.Users.findOne({ where: { id: item.idAgents[j] } })
          if (findUser) {
            await findUser.update({ fonction: item.label })
          }
        }
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
