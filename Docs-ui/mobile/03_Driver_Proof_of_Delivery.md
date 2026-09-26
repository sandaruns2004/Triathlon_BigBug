# Mobile — Proof of Delivery

## Purpose

Record a complete delivery outcome at the stop in a sequence that works with a poor or absent connection.

## Flow and screens

1. **Confirm quantities:** expected versus delivered per line; default matches the loader-approved manifest. Driver can mark a line partial, missing, damaged, or refused.
2. **Capture proof:** recipient name, optional signature, photo(s), and delivery note. Explain optional versus required evidence based on policy.
3. **Review outcome:** Delivered in full, partial delivery, delivery failed, or refused. Display discrepancies in plain language.
4. **Complete stop:** records local timestamp and moves the user to the next-stop route card.

## Layout principles

- One decision per screen with a visible step indicator (`1 of 3`), Back, and `Save for later`.
- Camera use happens through one large labelled button; provide a retake option and thumbnail confirmation.
- Quantity adjustments require a reason but support quick common choices. The dispatcher and store see the same outcome language.

## Data continuity

The final outcome updates the dispatcher’s operations view and makes the store receipt ready. If offline, it is labelled as saved locally—not delivered to others—until synchronization succeeds.

