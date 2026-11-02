// Payment connector. Checkout only talks to startPayment(), so switching from
// test payments to a real payment provider (PG) later changes this file only.
//
// Real PG later: create the payment on our server with the PG's secret key,
// send the shopper to the PG's payment page (redirect), and mark the order
// paid from the PG's server notification (webhook), never from the browser.
import type { Order, PaymentMethod } from "./types";

export type PaymentStart =
  | { kind: "test" } // show the test payment sheet, then confirmTestPayment()
  | { kind: "redirect"; url: string }; // real PG page (not connected yet)

export function startPayment(_order: Pick<Order, "id" | "email" | "totalKrw"> & { method: PaymentMethod }): PaymentStart {
  return { kind: "test" };
}
