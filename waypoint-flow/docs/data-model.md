# Data Model

Our application uses Firebase Firestore (NoSQL) as the primary data store. The data is organized into the following root collections:

### 1. `users`
Contains the core identities for all four roles (Dispatcher, Loader, Driver, Store Manager). Used by NextAuth for authentication and role-based access control.

### 2. `vehicles`
Represents the fleet capacity, status, and current location. The allocation engine reads from here to determine available capacity.

### 3. `outlets`
Stores the geographical and operational metadata for each store (e.g., dock types, time windows, parking constraints).

### 4. `orders`
The central source of truth for demand. Orders are created by the Store Manager and picked up by the Dispatcher's Plan Builder. Fields include volume, weight, temperature requirements, and deferral status.

### 5. `trips`
Created when a Dispatcher publishes a plan. A trip represents a sequence of stops for a specific vehicle on a specific date.

### 6. `trip_stops`
The individual drop-offs within a trip. These are tracked individually by the Driver and Store Manager to confirm receipt and flag discrepancies.

### 7. `exceptions`
A real-time log of issues reported during loading or transit (e.g., breakdowns, loading shortfalls). These surface immediately on the Dispatcher's dashboard.

### 8. `daily_metrics`
Aggregated statistics (e.g., total orders, active vehicles, on-time percentage) used to populate the morning health strip on the Dispatcher dashboard efficiently.
