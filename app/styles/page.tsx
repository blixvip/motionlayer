import { CreatorStyleLibrary } from "@/components/styles/CreatorStyleLibrary";
import { creatorStyleLibrary } from "@/lib/creator-styles";

export default function CreatorStylesPage() {
  return <CreatorStyleLibrary creators={creatorStyleLibrary.creators} />;
}
