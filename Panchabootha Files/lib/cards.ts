export const CARD_TEXT: Record<string, string> = {
  Agneyastra: "Remove 1 Jeeva from one opponent establishment. Counter: Varunastra.",
  Varunastra: "Destroy one opponent House; its Jeeva remain. Counter: Vayavyastra.",
  Vayavyastra: "Return one opponent Dhoota to its home. Counter: Parvathastra.",
  Parvathastra:
    "Move 1 Jeeva from a chosen opponent establishment to another they own with capacity; otherwise remove it. Counter: Indrastra.",
  Indrastra: "Opponent returns 1 chosen resource to the bank and reveals their hand. Counter: Agneyastra.",
  Brahmastra: "Super Astra — destroy one opponent City. Only Maha-Raksha stops it.",
  Pashupatastra: "Super Astra — destroy one opponent Fort. Only Maha-Raksha stops it.",
  Narayanastra: "Super Astra — destroy one opponent Temple. Only Maha-Raksha stops it.",
  Dhanavrishti: "Take 2 resources of your choice from the bank.",
  Sampatti: "Choose an element; take all of it from every other player's hand.",
  Parivartana: "Return 1 resource to the bank; take 2 of another single element.",
  Bhiksha: "Take 1 resource of your choice from the bank.",
  "Jeeva-Srishti": "Create 1 Jeeva for free on an owned establishment with capacity.",
  "Vayu-Siddhi": "Move one Dhoota exactly 2 hexes without paying Air.",
  Nirman: "Build a House for free, subject to the normal location and Jeeva rules.",
  Raksha: "Response only — cancel one normal elemental Astra aimed at you.",
  "Maha-Raksha": "Response only — cancel one Super Astra aimed at you."
};

export function describeCard(name: string) {
  return CARD_TEXT[name] ?? "";
}
