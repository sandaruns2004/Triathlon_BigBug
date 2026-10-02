enum MobileRole { driver, store }

class Principal {
  const Principal({
    required this.userId,
    required this.name,
    required this.role,
    this.depot,
    this.outletId,
    this.fixture = false,
    this.authVersion = 0,
    this.firebaseUid,
    this.offlineExpiresAt,
  });
  final String userId;
  final String name;
  final MobileRole role;
  final String? depot;
  final String? outletId;
  final bool fixture;
  final int authVersion;
  final String? firebaseUid;
  final DateTime? offlineExpiresAt;
  Map<String, dynamic> toJson() => {
    'userId': userId,
    'name': name,
    'role': role == MobileRole.driver ? 'driver' : 'store_manager',
    'depot': depot,
    'outletId': outletId,
    'authVersion': authVersion,
    'firebaseUid': firebaseUid,
    'offlineAccess': {'expiresAt': offlineExpiresAt?.toUtc().toIso8601String()},
  };
  factory Principal.fromJson(Map<String, dynamic> json) => Principal(
    userId: json['userId'] as String,
    name: json['name'] as String,
    role: switch (json['role']) {
      'driver' => MobileRole.driver,
      'store_manager' => MobileRole.store,
      _ => throw StateError('Unsupported native role.'),
    },
    depot: json['depot'] as String?,
    outletId: json['outletId'] as String?,
    authVersion: json['authVersion'] as int,
    firebaseUid: json['firebaseUid'] as String?,
    offlineExpiresAt: DateTime.tryParse(
      (json['offlineAccess'] as Map?)?['expiresAt'] as String? ?? '',
    ),
  );
}

class ManifestLine {
  const ManifestLine({
    required this.lineId,
    required this.productId,
    required this.name,
    required this.quantity,
    required this.unit,
  });
  final String lineId;
  final String productId;
  final String name;
  final int quantity;
  final String unit;
  factory ManifestLine.fromJson(Map<String, dynamic> json) => ManifestLine(
    lineId: json['lineId'] as String,
    productId: json['productId'] as String,
    name: json['name'] as String,
    quantity: json['quantity'] as int,
    unit: json['unit'] as String,
  );
}

class RouteStop {
  const RouteStop({
    required this.stopId,
    required this.orderId,
    required this.outletId,
    required this.name,
    required this.window,
    required this.instruction,
    required this.lines,
    this.status = 'pending',
    this.manifestRevision = 1,
    this.deliveryVersion = 0,
    this.orderFulfillmentVersion = 0,
    this.address = '',
    this.latitude,
    this.longitude,
  });
  final String stopId;
  final String orderId;
  final String outletId;
  final String name;
  final String window;
  final String instruction;
  final List<ManifestLine> lines;
  final String status, address;
  final int manifestRevision, deliveryVersion, orderFulfillmentVersion;
  final double? latitude, longitude;
  factory RouteStop.fromJson(Map<String, dynamic> json) => RouteStop(
    stopId: json['stopId'] as String,
    orderId: json['orderId'] as String,
    outletId: json['outletId'] as String,
    name: json['name'] as String,
    window: json['window'] as String,
    instruction: json['instruction'] as String,
    lines: (json['lines'] as List<dynamic>)
        .map((line) => ManifestLine.fromJson(line as Map<String, dynamic>))
        .toList(),
    status: json['status'] as String? ?? 'pending',
    address: json['address'] as String? ?? '',
    manifestRevision: json['stopManifestRevision'] as int? ?? 1,
    deliveryVersion: json['stopDeliveryVersion'] as int? ?? 0,
    orderFulfillmentVersion: json['orderFulfillmentVersion'] as int? ?? 0,
    latitude: (json['latitude'] as num?)?.toDouble(),
    longitude: (json['longitude'] as num?)?.toDouble(),
  );
}

class RouteSnapshot {
  const RouteSnapshot({
    required this.tripId,
    required this.vehicleId,
    required this.serviceDate,
    required this.depot,
    required this.district,
    required this.finish,
    required this.stops,
    this.routeRevision = 1,
    this.tripNumber = 1,
    this.handling = 'Handling specified in manifest',
    this.startEligible = true,
    this.nextTrip,
    this.released = true,
    this.status = 'ready_to_depart',
    this.assignmentVersion = 1,
    this.releaseVersion = 1,
    this.held = false,
    this.evidencePolicy = const {
      'maxBytes': 2097152,
      'maxPhotos': 3,
      'signatureRequired': false,
    },
    this.driverId,
    this.savedAt,
    this.fromCache = false,
  });
  final String tripId;
  final String vehicleId;
  final String serviceDate;
  final String depot;
  final String district;
  final String finish;
  final int routeRevision;
  final int tripNumber;
  final String handling;
  final bool startEligible;
  final Map<String, dynamic>? nextTrip;
  final bool released;
  final List<RouteStop> stops;
  final String status;
  final int assignmentVersion, releaseVersion;
  final bool held;
  final String? driverId;
  final Map<String, dynamic> evidencePolicy;
  final DateTime? savedAt;
  final bool fromCache;
  factory RouteSnapshot.fromJson(Map<String, dynamic> json) => RouteSnapshot(
    tripId: json['tripId'] as String,
    vehicleId: json['vehicleId'] as String,
    serviceDate: json['serviceDate'] as String,
    depot: json['depot'] as String,
    district: json['district'] as String,
    finish: json['finish'] as String,
    status: json['status'] as String? ?? 'loading',
    released: json['released'] == true,
    held: json['held'] == true,
    driverId: json['driverId'] as String?,
    assignmentVersion: json['assignmentVersion'] as int? ?? 0,
    releaseVersion: json['releaseVersion'] as int? ?? 0,
    routeRevision: json['routeRevision'] as int? ?? 1,
    tripNumber: json['tripNumber'] as int? ?? 1,
    startEligible: json['startEligible'] == true,
    nextTrip: json['_nextTrip'] as Map<String, dynamic>?,
    handling:
        json['handling'] as String? ??
        json['tempRequirement'] as String? ??
        'Handling specified in manifest',
    evidencePolicy: json['evidencePolicy'] as Map<String, dynamic>? ?? const {},
    savedAt: DateTime.tryParse(json['_savedAt'] as String? ?? ''),
    fromCache: json['_fromCache'] == true,
    stops: (json['stops'] as List<dynamic>)
        .map((s) => RouteStop.fromJson(s as Map<String, dynamic>))
        .toList(),
  );
}

class LocalDraft {
  const LocalDraft({
    required this.id,
    required this.entityId,
    required this.note,
    required this.updatedAt,
  });
  final String id;
  final String entityId;
  final String note;
  final DateTime updatedAt;
  Map<String, dynamic> toJson() => {
    'id': id,
    'entityId': entityId,
    'note': note,
    'updatedAt': updatedAt.toUtc().toIso8601String(),
  };
  factory LocalDraft.fromJson(Map<String, dynamic> json) => LocalDraft(
    id: json['id'] as String,
    entityId: json['entityId'] as String,
    note: json['note'] as String,
    updatedAt: DateTime.parse(json['updatedAt'] as String),
  );
}

enum OperationStatus {
  queued,
  uploading,
  submitting,
  synced,
  retryableError,
  authRequired,
  conflict,
}

class PendingOperation {
  const PendingOperation({
    required this.id,
    required this.entityId,
    required this.type,
    required this.payload,
    this.status = OperationStatus.queued,
    this.tripId,
    this.stopId,
    this.orderId,
    this.observedAt,
    this.concurrency = const {},
    this.dependencyIds = const [],
    this.evidenceIds = const [],
    this.ownerScope = const {},
  });
  final String id;
  final String entityId;
  final String type;
  final Map<String, dynamic> payload;
  final OperationStatus status;
  final String? tripId, stopId, orderId;
  final DateTime? observedAt;
  final Map<String, dynamic> concurrency;
  final List<String> dependencyIds, evidenceIds;
  final Map<String, dynamic> ownerScope;
  PendingOperation forPrincipal(Principal p) => PendingOperation(
    id: id,
    entityId: entityId,
    type: type,
    payload: payload,
    status: status,
    tripId: tripId,
    stopId: stopId,
    orderId: orderId,
    observedAt: observedAt ?? DateTime.now(),
    concurrency: {
      ...concurrency,
      'ownerScope': {
        'role': p.role == MobileRole.store ? 'store_manager' : 'driver',
        'depot': p.depot,
        'outletId': p.outletId,
      },
    },
    dependencyIds: dependencyIds,
    evidenceIds: evidenceIds,
    ownerScope: {'role': p.role.name, 'depot': p.depot, 'outletId': p.outletId},
  );
  Map<String, dynamic> get request => {
    'operationId': id,
    'schemaVersion': 1,
    'type': type,
    if (tripId != null) 'tripId': tripId,
    if (stopId != null) 'stopId': stopId,
    if (orderId != null) 'orderId': orderId,
    'observedAt': (observedAt ?? DateTime.now()).toUtc().toIso8601String(),
    'concurrency': concurrency,
    'payload': payload,
    'dependencyIds': dependencyIds,
  };
  Map<String, dynamic> toJson() => {
    'id': id,
    'entityId': entityId,
    'type': type,
    'payload': payload,
    'status': status.name,
    'request': request,
    'evidenceIds': evidenceIds,
    'attempts': 0,
    'ownerScope': ownerScope,
  };
}

bool operationScopeMatches(Map<String, dynamic> operation, Principal p) {
  final scope = operation['ownerScope'];
  return scope is Map &&
      scope['role'] == p.role.name &&
      scope['depot'] == p.depot &&
      scope['outletId'] == p.outletId;
}

class StorageFailure implements Exception {
  const StorageFailure(this.message);
  final String message;
  @override
  String toString() => message;
}
