export interface ParsedVehicleDocument {
  documentType:
    | "vehicle_registration"
    | "insurance_card"
    | "service_record"
    | "license_plate_photo"
    | "title"
    | "drivers_license"
    | "inspection_report"
    | "other";
  confidence: number;
  fields: {
    vin: string | null;
    licensePlate: string | null;
    state: string | null;
    make: string | null;
    model: string | null;
    year: number | null;
    color: string | null;
    ownerName: string | null;
    ownerAddress: string | null;
    expirationDate: string | null;
    issueDate: string | null;
    insuranceProvider: string | null;
    policyNumber: string | null;
    registrationNumber: string | null;
    odometerReading: string | null;
    serviceDescription: string | null;
    serviceDate: string | null;
  };
  rawText: string;
}
