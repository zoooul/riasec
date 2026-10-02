import { ErgebnisClient } from "@/components/ErgebnisClient";
import { LicenseAttribution } from "@/components/LicenseAttribution";
import { getMvpItems } from "@/lib/items.server";
import { getAttributionLines } from "@/lib/licenses.server";
import { getOccupationSeeds } from "@/lib/occupations.server";
import { getAllProfiles } from "@/lib/profiles.server";

export default function ErgebnisPage() {
  const items = getMvpItems();
  const profiles = getAllProfiles();
  const occupations = getOccupationSeeds();
  const attribution = getAttributionLines(["core", "owned"]);

  return (
    <>
      <ErgebnisClient
        items={items}
        profiles={profiles}
        occupations={occupations}
        attribution={attribution}
      />
      <LicenseAttribution lines={attribution} />
    </>
  );
}
