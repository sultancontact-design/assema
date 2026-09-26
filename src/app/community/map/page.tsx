import { redirect } from "next/navigation";

// v32.0: old flat SVG map — now redirects to 3D MapLibre map
export default function MapRedirectPage() {
  redirect("/community/map-3d");
}
