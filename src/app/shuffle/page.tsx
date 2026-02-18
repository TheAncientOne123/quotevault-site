import { redirect } from "next/navigation";

export default function ShufflePage() {
  redirect("/?mode=shuffle");
}
