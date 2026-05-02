import { redirect } from "next/navigation";

/** Legacy URL: same as Portfolio (`/investing/holdings`). */
export default function InvestingTableAliasPage() {
  redirect("/investing/holdings");
}
