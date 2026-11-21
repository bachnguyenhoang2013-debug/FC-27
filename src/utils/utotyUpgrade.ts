import { PlayerCard } from '../types/game';

/**
 * Checks whether a base card is a TOTY-season 99+ OVR player eligible
 * to exchange its TOTY card frame for the Ultimate TOTY (UTOTY) frame with +2 OVR.
 */
export function isEligibleToty99Plus(card: PlayerCard): boolean {
  return (
    card.ovr >= 99 &&
    (card.cardType === 'TOTY' || card.cardType === 'UTOTY') &&
    !card.isUtotyUpgraded
  );
}

/**
 * Transforms an eligible TOTY 99+ player card into its upgraded UTOTY version
 * (+2 OVR, +2 across all 6 core attributes, and UTOTY star card frame).
 */
export function toUtotyUpgradedCard(card: PlayerCard): PlayerCard {
  if (card.isUtotyUpgraded) return card;
  return {
    ...card,
    baseOvr: card.baseOvr ?? card.ovr,
    ovr: card.ovr + 2,
    pac: card.pac + 2,
    sho: card.sho + 2,
    pas: card.pas + 2,
    dri: card.dri + 2,
    def: card.def + 2,
    phy: card.phy + 2,
    cardType: 'UTOTY',
    isUtotyUpgraded: true,
  };
}

/**
 * Resolves a player card with UTOTY upgrade applied if its ID is in utotyUpgradedIds.
 */
export function resolvePlayerWithUtotyUpgrade(
  card: PlayerCard,
  upgradedIds?: string[] | Set<string>
): PlayerCard {
  if (!upgradedIds) return card;
  const hasUpgrade = Array.isArray(upgradedIds)
    ? upgradedIds.includes(card.id)
    : upgradedIds.has(card.id);
  if (hasUpgrade && isEligibleToty99Plus(card)) {
    return toUtotyUpgradedCard(card);
  }
  return card;
}
