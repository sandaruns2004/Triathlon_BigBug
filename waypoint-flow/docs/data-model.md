# Waypoint Flow — Data Model

## Database: Firebase Firestore (NoSQL)

All data is stored in Firebase Firestore as document collections. There is no relational schema — documents use embedded sub-objects and ID references.

## Collections

### Reference Data (seeded from challenge CSVs)

| Collection | Key Fields | Description |
|---|---|---|
| `vehicles` | `vehicleId`, `type`, `temp`, `weightCapKg`, `volumeCapM3`, `depot` | 60 Waypoint delivery vehicles |
| `outlets` | `outletId`, `name`, `brand`, `district`, `depot`, `dockType`, `parkingConstraint` | 120 retail outlets |
| `districts` | `district`, `depot`, `depotToDistrictFreeflowMin`, `interStopFreeflowMin` | Route distance/time data |
| `serviceAllowances` | `brand`, `dockType`, `serviceAllowanceMin` | Time per stop per brand/dock type |
| `calendar` | `date`, `isWeekend`, `isHoliday`, `monsoon`, `isOperating` | Operating calendar |
| `trafficSpeeds` | `district`, `hour`, `monsoon`, `speedIndex` | Hourly traffic speed data |

### Operational Data

| Collection | Key Fields | Description |
|---|---|---|
| `users` | `id`, `name`, `email`, `role`, `depot`, `outletId`, `passwordHash` | 4 seeded accounts (one per role) |
| `trips` | `tripId`, `vehicleId`, `brand`, `district`, `status`, `planDate` | Delivery trips (1-2 per vehicle per day) |
| `trip_stops` | `stopId`, `tripId`, `outletId`, `stopOrder`, `status`, `expectedKg` | Individual stops per trip |
| `orders` | `orderId`, `outletId`, `status`, `deferralReason`, `deferredYesterday` | Store orders (status tracks through workflow) |
| `exceptions` | `exceptionId`, `type`, `severity`, `resolved`, `tripId` | Dispatcher exception queue |
| `daily_metrics` | `date`, `depot`, `ordersToPlan`, `tripsPlanned`, `activeExceptions` | Dashboard health strip data |
| `deliveries` | `deliveryId`, `orderId`, `driverId`, `outcome`, `photoUrl`, `syncedAt` | Proof of delivery records |
| `discrepancies` | `discrepancyId`, `deliveryId`, `type`, `quantity`, `reportedBy` | Store-reported receipt issues |

## Key Relationships

```
trips ──────(vehicleId)──────▶ vehicles
trip_stops ─(tripId)──────────▶ trips
trip_stops ─(outletId)────────▶ outlets
orders ─────(outletId)────────▶ outlets
orders ─────(tripId)──────────▶ trips (when assigned)
deliveries ─(orderId)─────────▶ orders
discrepancies ─(deliveryId)───▶ deliveries
exceptions ─(tripId)──────────▶ trips
```

## Order Status Flow

```
submitted → pending → assigned → loading → on_route → delivered → receipt_confirmed
                                              ↓
                                          deferred (with mandatory deferralReason)
```

## Critical Rules

- `deferralReason` is NEVER null when `status = 'deferred'` — enforced in API route
- `syncedAt` is `null` when a delivery outcome is saved locally on the driver's device only
- `deferredYesterday = true` orders get priority in the allocation engine
