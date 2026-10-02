import { ErgebnisClient } from "@/components/ErgebnisClient";
import { getMvpItems } from "@/lib/items";
import { getOccupationSeeds } from "@/lib/occupations.server";
import { getAllProfiles } from "@/lib/profiles";

export default function ErgebnisPage() {
  const items = getMvpItems();
  const profiles = getAllProfiles();
  const occupations = getOccupationSeeds();

  return (
    <ErgebnisClient
      items={items}
      profiles={profiles}
      occupations={occupations}
    />
  );
}
