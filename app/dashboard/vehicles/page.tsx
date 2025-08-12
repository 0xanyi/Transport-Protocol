"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/ui/image-upload";
import { createClient } from "@/lib/supabase/client";
import { Vehicle } from "@/types";
import {
  Car,
  Fuel,
  MapPin,
  Calendar,
  Plus,
  X,
  Camera,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";

interface UploadedImage {
  key: string;
  publicUrl: string;
  file?: File;
}

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showPhotos, setShowPhotos] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    registration: "",
    is_hired: true,
    pickup_location: "",
    pickup_mileage: "",
    pickup_fuel_gauge: "",
    pickup_date: new Date().toISOString().split("T")[0],
  });
  const [pickupPhotos, setPickupPhotos] = useState<UploadedImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Handle escape key for lightbox
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxImage(null);
      }
    };

    if (lightboxImage) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when lightbox is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [lightboxImage]);

  const fetchVehicles = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log("Fetched vehicles:", data);
      setVehicles(data || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      // Validate required fields
      if (
        !formData.make ||
        !formData.model ||
        !formData.registration ||
        !formData.pickup_location
      ) {
        throw new Error("Please fill in all required fields");
      }

      const pickupMileage = parseInt(formData.pickup_mileage);
      const pickupFuelGauge = parseInt(formData.pickup_fuel_gauge);

      if (isNaN(pickupMileage) || pickupMileage < 0) {
        throw new Error("Please enter a valid mileage");
      }

      if (
        isNaN(pickupFuelGauge) ||
        pickupFuelGauge < 0 ||
        pickupFuelGauge > 100
      ) {
        throw new Error("Please enter a valid fuel gauge percentage (0-100)");
      }

      // Prepare vehicle data with photos
      const vehicleData = {
        ...formData,
        pickup_mileage: pickupMileage,
        pickup_fuel_gauge: pickupFuelGauge,
        pickup_photos: pickupPhotos.map((photo) => photo.publicUrl),
      };

      const { error } = await supabase.from("vehicles").insert([vehicleData]);

      if (error) throw error;

      // Reset form and refresh list
      setFormData({
        make: "",
        model: "",
        registration: "",
        is_hired: true,
        pickup_location: "",
        pickup_mileage: "",
        pickup_fuel_gauge: "",
        pickup_date: new Date().toISOString().split("T")[0],
      });
      setPickupPhotos([]);
      setShowAddForm(false);
      fetchVehicles();
    } catch (error: any) {
      console.error("Error adding vehicle:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        full: error,
      });

      // Handle specific error types
      let errorMessage = "Failed to add vehicle. Please try again.";

      if (
        error?.message?.includes("new row violates row-level security policy")
      ) {
        errorMessage =
          "Database access denied. Please check your permissions or contact an administrator.";
      } else if (error?.code === "PGRST301") {
        errorMessage =
          "Database permission error. The vehicles table may need proper access policies.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", vehicleId);

      if (error) throw error;

      setShowDeleteConfirm(null);
      fetchVehicles();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete vehicle"
      );
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      registration: vehicle.registration,
      is_hired: vehicle.is_hired,
      pickup_location: vehicle.pickup_location,
      pickup_mileage: vehicle.pickup_mileage.toString(),
      pickup_fuel_gauge: vehicle.pickup_fuel_gauge.toString(),
      pickup_date: new Date(vehicle.pickup_date).toISOString().split("T")[0],
    });

    // Load existing photos into the form
    const existingPhotos =
      vehicle.pickup_photos?.map((url) => ({
        key: url.split("/").pop() || "",
        publicUrl: url,
      })) || [];

    console.log("Loading existing photos into form:", existingPhotos);
    setPickupPhotos(existingPhotos);
    setEditingVehicle(vehicle);
    setShowAddForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    setSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (
        !formData.make ||
        !formData.model ||
        !formData.registration ||
        !formData.pickup_location
      ) {
        throw new Error("Please fill in all required fields");
      }

      const pickupMileage = parseInt(formData.pickup_mileage);
      const pickupFuelGauge = parseInt(formData.pickup_fuel_gauge);

      if (isNaN(pickupMileage) || pickupMileage < 0) {
        throw new Error("Please enter a valid mileage");
      }

      if (
        isNaN(pickupFuelGauge) ||
        pickupFuelGauge < 0 ||
        pickupFuelGauge > 100
      ) {
        throw new Error("Please enter a valid fuel gauge percentage (0-100)");
      }

      const supabase = createClient();

      // Merge existing photos with new ones (don't replace, just add)
      const allPhotos = pickupPhotos.map((photo) => photo.publicUrl);

      const vehicleData = {
        ...formData,
        pickup_mileage: pickupMileage,
        pickup_fuel_gauge: pickupFuelGauge,
        pickup_photos: allPhotos,
      };

      console.log("Updating vehicle with data:", vehicleData);
      console.log("All photos (existing + new):", allPhotos);
      console.log("Current pickupPhotos state:", pickupPhotos);

      const { error } = await supabase
        .from("vehicles")
        .update(vehicleData)
        .eq("id", editingVehicle.id);

      if (error) throw error;

      // Reset form and refresh list
      setFormData({
        make: "",
        model: "",
        registration: "",
        is_hired: true,
        pickup_location: "",
        pickup_mileage: "",
        pickup_fuel_gauge: "",
        pickup_date: new Date().toISOString().split("T")[0],
      });
      setPickupPhotos([]);
      setEditingVehicle(null);
      setShowAddForm(false);
      fetchVehicles();
    } catch (error: any) {
      console.error("Error updating vehicle:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update vehicle"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setEditingVehicle(null);
    setShowAddForm(false);
    setFormData({
      make: "",
      model: "",
      registration: "",
      is_hired: true,
      pickup_location: "",
      pickup_mileage: "",
      pickup_fuel_gauge: "",
      pickup_date: new Date().toISOString().split("T")[0],
    });
    setPickupPhotos([]);
    setError(null);
  };

  const getFuelGaugeColor = (gauge: number) => {
    if (gauge >= 75) return "text-green-600";
    if (gauge >= 50) return "text-yellow-600";
    if (gauge >= 25) return "text-orange-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Vehicle Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage rental vehicles for the event
          </p>
        </div>

        <Button
          onClick={() => (showAddForm ? cancelEdit() : setShowAddForm(true))}
        >
          {showAddForm ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </>
          )}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingVehicle ? (
                <>
                  Edit Vehicle: {editingVehicle.make} {editingVehicle.model}
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    ({editingVehicle.registration})
                  </span>
                </>
              ) : (
                "Add New Vehicle"
              )}
            </CardTitle>
            <CardDescription>
              {editingVehicle
                ? "Update vehicle details and photos"
                : "Enter vehicle pickup details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={editingVehicle ? handleUpdate : handleSubmit}
              className="space-y-4"
            >
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    name="make"
                    required
                    value={formData.make}
                    onChange={handleChange}
                    placeholder="Toyota"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    name="model"
                    required
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="Camry"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration">Registration *</Label>
                  <Input
                    id="registration"
                    name="registration"
                    required
                    value={formData.registration}
                    onChange={handleChange}
                    placeholder="AB12 CDE"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup_location">Pickup Location *</Label>
                  <Input
                    id="pickup_location"
                    name="pickup_location"
                    required
                    value={formData.pickup_location}
                    onChange={handleChange}
                    placeholder="Heathrow Airport"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickup_date">Pickup Date *</Label>
                  <Input
                    id="pickup_date"
                    name="pickup_date"
                    type="date"
                    required
                    value={formData.pickup_date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup_mileage">Pickup Mileage *</Label>
                  <Input
                    id="pickup_mileage"
                    name="pickup_mileage"
                    type="number"
                    required
                    value={formData.pickup_mileage}
                    onChange={handleChange}
                    placeholder="25000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickup_fuel_gauge">Fuel Gauge (%) *</Label>
                  <Input
                    id="pickup_fuel_gauge"
                    name="pickup_fuel_gauge"
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formData.pickup_fuel_gauge}
                    onChange={handleChange}
                    placeholder="75"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_hired"
                  name="is_hired"
                  checked={formData.is_hired}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_hired">This is a hired/rental vehicle</Label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Pickup Photos Section */}
              <div className="space-y-2">
                <Label>Pickup Photos</Label>
                <p className="text-sm text-gray-600">
                  Take photos of the vehicle condition at pickup. These will be
                  used for comparison during return.
                  {editingVehicle && " Add more photos to the existing ones."}
                </p>
                <ImageUpload
                  onImagesChange={setPickupPhotos}
                  existingImages={editingVehicle?.pickup_photos || []}
                  maxImages={8}
                  vehicleId={editingVehicle?.id}
                  className="mt-2"
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting
                  ? editingVehicle
                    ? "Updating Vehicle..."
                    : "Adding Vehicle..."
                  : editingVehicle
                  ? "Update Vehicle"
                  : "Add Vehicle"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No vehicles added yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Click "Add Vehicle" to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          vehicles.map((vehicle) => (
            <Card
              key={vehicle.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Car className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold">
                        {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-sm text-gray-600">
                        {vehicle.registration}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {vehicle.is_hired && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        HIRED
                      </span>
                    )}
                    {(vehicle.pickup_photos?.length || 0) +
                      (vehicle.dropoff_photos?.length || 0) >
                      0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center">
                        <Camera className="w-3 h-3 mr-1" />
                        {(vehicle.pickup_photos?.length || 0) +
                          (vehicle.dropoff_photos?.length || 0)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-gray-600">
                      <MapPin className="w-3 h-3 mr-1" />
                      Location
                    </span>
                    <span className="font-medium">
                      {vehicle.pickup_location}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-gray-600">
                      <Calendar className="w-3 h-3 mr-1" />
                      Pickup
                    </span>
                    <span className="font-medium">
                      {format(new Date(vehicle.pickup_date), "dd MMM yyyy")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Mileage</span>
                    <span className="font-medium">
                      {vehicle.pickup_mileage.toLocaleString()} mi
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-gray-600">
                      <Fuel className="w-3 h-3 mr-1" />
                      Fuel
                    </span>
                    <span
                      className={`font-medium ${getFuelGaugeColor(
                        vehicle.pickup_fuel_gauge
                      )}`}
                    >
                      {vehicle.pickup_fuel_gauge}%
                    </span>
                  </div>
                </div>

                {vehicle.current_driver_id ? (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <p className="text-xs text-green-600 font-medium">
                      ASSIGNED
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/vehicles/${vehicle.id}/return`)
                      }
                      className="w-full text-xs"
                    >
                      Process Return
                    </Button>
                  </div>
                ) : vehicle.dropoff_date ? (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-blue-600 font-medium">
                      RETURNED
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(vehicle.dropoff_date), "dd MMM yyyy")}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-400">
                      Available for assignment
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(vehicle)}
                      className="text-xs"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setShowPhotos(true);
                      }}
                      className="text-xs"
                      disabled={
                        (vehicle.pickup_photos?.length || 0) +
                          (vehicle.dropoff_photos?.length || 0) ===
                        0
                      }
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Photos (
                      {(vehicle.pickup_photos?.length || 0) +
                        (vehicle.dropoff_photos?.length || 0)}
                      )
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(vehicle.id)}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                  <span>
                    Added {format(new Date(vehicle.created_at), "dd MMM")}
                  </span>
                  {(vehicle.pickup_photos?.length || 0) +
                    (vehicle.dropoff_photos?.length || 0) >
                    0 && (
                    <span className="flex items-center">
                      <Camera className="w-3 h-3 mr-1" />
                      {(vehicle.pickup_photos?.length || 0) +
                        (vehicle.dropoff_photos?.length || 0)}{" "}
                      photos
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Photo Viewing Modal */}
      {showPhotos && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {selectedVehicle.make} {selectedVehicle.model} Photos
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowPhotos(false);
                    setSelectedVehicle(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Pickup Photos */}
                {selectedVehicle.pickup_photos &&
                  selectedVehicle.pickup_photos.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Camera className="w-5 h-5 mr-2 text-green-600" />
                        Pickup Photos ({selectedVehicle.pickup_photos.length})
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedVehicle.pickup_photos.map((photo, index) => {
                          console.log("Rendering pickup photo:", photo);
                          return (
                            <div
                              key={index}
                              className="aspect-square rounded-lg overflow-hidden border bg-gray-50"
                            >
                              <div className="w-full h-full flex flex-col">
                                <img
                                  src={photo}
                                  alt={`Pickup photo ${index + 1}`}
                                  className="flex-1 w-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                  onClick={() => setLightboxImage(photo)}
                                  onError={(e) => {
                                    console.error(
                                      "Failed to load image:",
                                      photo
                                    );
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* Dropoff Photos */}
                {selectedVehicle.dropoff_photos &&
                  selectedVehicle.dropoff_photos.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Camera className="w-5 h-5 mr-2 text-red-600" />
                        Dropoff Photos ({selectedVehicle.dropoff_photos.length})
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedVehicle.dropoff_photos.map((photo, index) => (
                          <div
                            key={index}
                            className="aspect-square rounded-lg overflow-hidden border"
                          >
                            <img
                              src={photo}
                              alt={`Dropoff photo ${index + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                              onClick={() => setLightboxImage(photo)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {(!selectedVehicle.pickup_photos ||
                  selectedVehicle.pickup_photos.length === 0) &&
                  (!selectedVehicle.dropoff_photos ||
                    selectedVehicle.dropoff_photos.length === 0) && (
                    <div className="text-center py-8">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No photos available for this vehicle
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4">
          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image */}
            <img
              src={lightboxImage}
              alt="Full size image"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={() => setLightboxImage(null)}
            />

            {/* Click outside to close */}
            <div
              className="absolute inset-0 -z-10"
              onClick={() => setLightboxImage(null)}
            />
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-full">
            Click image or X to close
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Vehicle
                </h3>
                <p className="text-sm text-gray-600">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this vehicle? All associated data
              including photos will be permanently removed.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(showDeleteConfirm)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Vehicle
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
