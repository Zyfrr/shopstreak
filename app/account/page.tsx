// app/account/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  User,
  Package,
  Heart,
  MapPin,
  Edit2,
  Save,
  X,
  Plus,
  Loader2,
  Trash2,
  Check,
  Search,
} from "lucide-react";
import { AccountLayout } from "@/components/layout/account-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  joinDate: string;
  gender?: string;
}

interface Address {
  _id: string;
  SS_ADDRESS_TYPE: string;
  SS_FULL_NAME: string;
  SS_MOBILE_NUMBER: string;
  SS_STREET_ADDRESS: string;
  SS_CITY: string;
  SS_STATE: string;
  SS_POSTAL_CODE: string;
  SS_COUNTRY: string;
  SS_IS_DEFAULT: boolean;
  SS_IS_CURRENT: boolean;
}

interface AddressFormData {
  fullName: string;
  mobileNumber: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: "home" | "work" | "other";
  isDefault: boolean;
}

// Separate Address Form Component
function AddressFormComponent({
  showAddressForm,
  setShowAddressForm,
  editingAddress,
  addressForm,
  setAddressForm,
  isSubmitting,
  isFetchingPincode,
  userData,
  addresses,
  handleSaveAddress,
  fetchPincodeDetails,
}: {
  showAddressForm: boolean;
  setShowAddressForm: (show: boolean) => void;
  editingAddress: Address | null;
  addressForm: AddressFormData;
  setAddressForm: (form: AddressFormData) => void;
  isSubmitting: boolean;
  isFetchingPincode: boolean;
  userData: UserProfile;
  addresses: Address[];
  handleSaveAddress: () => void;
  fetchPincodeDetails: (pincode: string) => void;
}) {
  const resetAddressForm = useCallback(() => {
    setAddressForm({
      fullName: `${userData.firstName} ${userData.lastName}`.trim(),
      mobileNumber: userData.mobileNumber || "",
      streetAddress: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      addressType: "home",
      isDefault: addresses.length === 0,
    });
  }, [userData, addresses.length, setAddressForm]);

  const handleManualPincodeSearch = () => {
    if (addressForm.postalCode.length === 6) {
      fetchPincodeDetails(addressForm.postalCode);
    }
  };

  const handleCancel = () => {
    setShowAddressForm(false);
    resetAddressForm();
  };

  if (!showAddressForm) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg sm:text-xl mb-6">
          {editingAddress ? "Edit Address" : "Add New Address"}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="sm:col-span-2">
            <Label
              htmlFor="fullName"
              className="text-sm font-medium mb-2 block"
            >
              Full Name *
            </Label>
            <Input
              id="fullName"
              value={addressForm.fullName}
              onChange={(e) =>
                setAddressForm({ ...addressForm, fullName: e.target.value })
              }
              placeholder="Enter full name"
              className="w-full"
            />
          </div>

          {/* Mobile Number */}
          <div className="sm:col-span-2">
            <Label
              htmlFor="mobileNumber"
              className="text-sm font-medium mb-2 block"
            >
              Mobile Number *
            </Label>
            <Input
              id="mobileNumber"
              value={addressForm.mobileNumber}
              onChange={(e) =>
                setAddressForm({
                  ...addressForm,
                  mobileNumber: e.target.value.replace(/\D/g, "").slice(0, 10),
                })
              }
              placeholder="10-digit mobile number"
              className="w-full"
              maxLength={10}
            />
          </div>

          {/* Street Address */}
          <div className="sm:col-span-2">
            <Label
              htmlFor="streetAddress"
              className="text-sm font-medium mb-2 block"
            >
              Street Address *
            </Label>
            <Input
              id="streetAddress"
              value={addressForm.streetAddress}
              onChange={(e) =>
                setAddressForm({
                  ...addressForm,
                  streetAddress: e.target.value,
                })
              }
              placeholder="House no., Building, Street, Area"
              className="w-full"
            />
          </div>

          {/* Pincode */}
          <div className="sm:col-span-2">
            <Label
              htmlFor="postalCode"
              className="text-sm font-medium mb-2 block"
            >
              Pincode *
            </Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  id="postalCode"
                  value={addressForm.postalCode}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      postalCode: e.target.value.replace(/\D/g, "").slice(0, 6),
                    })
                  }
                  placeholder="6-digit pincode"
                  className="w-full"
                  maxLength={6}
                />
                {isFetchingPincode && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleManualPincodeSearch}
                disabled={
                  addressForm.postalCode.length !== 6 || isFetchingPincode
                }
                className="whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* City & State */}
          <div>
            <Label htmlFor="city" className="text-sm font-medium mb-2 block">
              City *
            </Label>
            <Input
              id="city"
              value={addressForm.city}
              onChange={(e) =>
                setAddressForm({ ...addressForm, city: e.target.value })
              }
              placeholder="City"
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="state" className="text-sm font-medium mb-2 block">
              State *
            </Label>
            <Input
              id="state"
              value={addressForm.state}
              onChange={(e) =>
                setAddressForm({ ...addressForm, state: e.target.value })
              }
              placeholder="State"
              className="w-full"
            />
          </div>

          {/* Country */}
          <div className="sm:col-span-2">
            <Label htmlFor="country" className="text-sm font-medium mb-2 block">
              Country
            </Label>
            <Input
              id="country"
              value={addressForm.country}
              onChange={(e) =>
                setAddressForm({ ...addressForm, country: e.target.value })
              }
              placeholder="Country"
              className="w-full"
              disabled
            />
          </div>

          {/* Address Type */}
          <div className="sm:col-span-2">
            <Label
              htmlFor="addressType"
              className="text-sm font-medium mb-2 block"
            >
              Address Type
            </Label>
            <Select
              value={addressForm.addressType}
              onValueChange={(value: "home" | "work" | "other") =>
                setAddressForm({ ...addressForm, addressType: value })
              }
            >
              <SelectTrigger id="addressType" className="w-full">
                <SelectValue placeholder="Select address type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Default Address Checkbox */}
          <div className="sm:col-span-2 flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={addressForm.isDefault}
              onChange={(e) =>
                setAddressForm({ ...addressForm, isDefault: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="isDefault" className="text-sm cursor-pointer">
              Set as default address
            </Label>
          </div>
        </div>

        <div className="flex gap-3 mt-8 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveAddress}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Address"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmationModal({
  showDeleteModal,
  setShowDeleteModal,
  addressToDelete,
  handleRemoveAddress,
}: {
  showDeleteModal: boolean;
  setShowDeleteModal: (show: boolean) => void;
  addressToDelete: Address | null;
  handleRemoveAddress: (id: string) => void;
}) {
  if (!showDeleteModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
        <div className="text-center">
          <Trash2 className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Delete Address</h3>
          <p className="text-muted-foreground mb-6">
            Are you sure you want to delete this address? This action cannot be
            undone.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() =>
              addressToDelete && handleRemoveAddress(addressToDelete._id)
            }
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [userData, setUserData] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    joinDate: "",
  });

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [tempData, setTempData] = useState<UserProfile>(userData);

  const [addressForm, setAddressForm] = useState<AddressFormData>({
    fullName: "",
    mobileNumber: "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    addressType: "home",
    isDefault: false,
  });

  // Fetch pincode details
  const fetchPincodeDetails = useCallback(async (pincode: string) => {
    if (pincode.length !== 6) return;

    setIsFetchingPincode(true);
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`
      );
      const data = await response.json();

      if (data[0]?.Status === "Success" && data[0]?.PostOffice?.[0]) {
        const postOffice = data[0].PostOffice[0];
        setAddressForm((prev) => ({
          ...prev,
          city: postOffice.District || postOffice.Block || "",
          state: postOffice.State || "",
          country: postOffice.Country || "India",
        }));

        toast.success("Address details auto-filled!");
      } else {
        toast.error("Invalid pincode or no details found");
      }
    } catch (error) {
      console.error("Pincode API error:", error);
      toast.error("Failed to fetch address details");
    } finally {
      setIsFetchingPincode(false);
    }
  }, []);

  // Auto-fetch pincode details when pincode is 6 digits
  useEffect(() => {
    if (addressForm.postalCode.length === 6) {
      const timer = setTimeout(() => {
        fetchPincodeDetails(addressForm.postalCode);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [addressForm.postalCode, fetchPincodeDetails]);

  // Fetch user profile and addresses
useEffect(() => {
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Please login first");
        return;
      }

      const [profileResponse, addressResponse] = await Promise.all([
        fetch("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/users/address", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (profileResponse.ok) {
        const profileResult = await profileResponse.json();
        if (profileResult.success) {
          const { user, profile } = profileResult.data;
          const userProfile = {
            firstName: profile?.firstName || "",
            lastName: profile?.lastName || "",
            email: user?.email || "",
            mobileNumber: profile?.mobileNumber || "",
            joinDate: new Date(
              user?.createdAt || Date.now()
            ).toLocaleDateString("en-US", { year: "numeric", month: "long" }),
            gender: profile?.gender,
          };
          setUserData(userProfile);
          setTempData(userProfile);
        }
      }

      if (addressResponse.ok) {
        const addressResult = await addressResponse.json();
        if (addressResult.success) {
          const fetchedAddresses = addressResult.data.addresses || [];
          setAddresses(fetchedAddresses);

          // Set current address as selected - FIXED LOGIC
          let currentAddress = fetchedAddresses.find((addr) => addr.SS_IS_CURRENT);
          
          // If no current address but addresses exist, set the first one as current
          if (!currentAddress && fetchedAddresses.length > 0) {
            currentAddress = fetchedAddresses[0];
            // Auto-set the first address as current in backend
            await handleSetCurrentAddress(currentAddress._id);
          }
          
          setSelectedAddress(currentAddress);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  };

  fetchUserData();
}, []);

  const handleEdit = () => {
    setTempData(userData);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: tempData.firstName,
          lastName: tempData.lastName,
          mobileNumber: tempData.mobileNumber,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUserData(tempData);
        setIsEditing(false);

        const userDataStorage = JSON.parse(
          localStorage.getItem("userData") || "{}"
        );
        localStorage.setItem(
          "userData",
          JSON.stringify({
            ...userDataStorage,
            firstName: tempData.firstName,
            lastName: tempData.lastName,
            mobileNumber: tempData.mobileNumber,
          })
        );

        toast.success("Profile updated successfully!");
      } else {
        toast.error(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTempData(userData);
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setTempData((prev) => ({ ...prev, [field]: value }));
  };

  // Address Management Functions
const resetAddressForm = useCallback(() => {
  setAddressForm({
    fullName: `${userData.firstName} ${userData.lastName}`.trim(),
    mobileNumber: userData.mobileNumber || "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    addressType: "home",
    // Set as default if no addresses exist (which also means it will be current)
    isDefault: addresses.length === 0,
  });
  setEditingAddress(null);
}, [userData, addresses.length]);
  const handleAddAddress = () => {
    resetAddressForm();
    setShowAddressForm(true);
  };

  const handleEditAddress = (address: Address) => {
    setAddressForm({
      fullName: address.SS_FULL_NAME,
      mobileNumber: address.SS_MOBILE_NUMBER,
      streetAddress: address.SS_STREET_ADDRESS,
      city: address.SS_CITY,
      state: address.SS_STATE,
      postalCode: address.SS_POSTAL_CODE,
      country: address.SS_COUNTRY,
      addressType: address.SS_ADDRESS_TYPE as "home" | "work" | "other",
      isDefault: address.SS_IS_DEFAULT,
    });
    setEditingAddress(address);
    setShowAddressForm(true);
  };

 const handleSaveAddress = async () => {
  if (
    !addressForm.fullName ||
    !addressForm.mobileNumber ||
    !addressForm.streetAddress ||
    !addressForm.city ||
    !addressForm.state ||
    !addressForm.postalCode
  ) {
    toast.error("Please fill all required fields");
    return;
  }

  setIsSubmitting(true);
  try {
    const token = localStorage.getItem("accessToken");
    const url = "/api/users/address";
    const method = editingAddress ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(
        editingAddress
          ? { ...addressForm, addressId: editingAddress._id }
          : addressForm
      ),
    });

    const result = await response.json();

    if (result.success) {
      if (editingAddress) {
        const updatedAddresses = addresses.map((addr) =>
          addr._id === editingAddress._id ? result.data.address : addr
        );
        setAddresses(updatedAddresses);

        // Update selected address if it was edited
        if (selectedAddress?._id === editingAddress._id) {
          setSelectedAddress(result.data.address);
        }
        toast.success("Address updated successfully!");
      } else {
        const newAddresses = [...addresses, result.data.address];
        setAddresses(newAddresses);

        // ALWAYS set as current if it's the first address
        if (newAddresses.length === 1) {
          await handleSetCurrentAddress(result.data.address._id);
          toast.success("Address added and set as current delivery address!");
        } 
        // Or set as current if marked as default
        else if (addressForm.isDefault) {
          await handleSetCurrentAddress(result.data.address._id);
          toast.success("Address added and set as current delivery address!");
        }
        else {
          toast.success("Address added successfully!");
        }
      }
      setShowAddressForm(false);
      resetAddressForm();
    } else {
      toast.error(result.message || "Failed to save address");
    }
  } catch (error) {
    console.error("Address save error:", error);
    toast.error("Network error");
  } finally {
    setIsSubmitting(false);
  }
};
  const handleRemoveAddress = async (id: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/users/address?addressId=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        const updatedAddresses = addresses.filter(
          (address) => address._id !== id
        );
        setAddresses(updatedAddresses);

        // Update selected address if the removed one was selected
        if (selectedAddress?._id === id) {
          const newCurrent =
            updatedAddresses.find((addr) => addr.SS_IS_CURRENT) ||
            updatedAddresses[0];
          setSelectedAddress(newCurrent);
        }

        toast.success("Address removed successfully");
      } else {
        toast.error(result.message || "Failed to remove address");
      }
    } catch (error) {
      console.error("Address removal error:", error);
      toast.error("Network error");
    } finally {
      setShowDeleteModal(false);
      setAddressToDelete(null);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/users/address", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          addressId: id,
          isDefault: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const updatedAddresses = addresses.map((address) => ({
          ...address,
          SS_IS_DEFAULT: address._id === id,
        }));
        setAddresses(updatedAddresses);
        toast.success("Default address updated");
      } else {
        toast.error(result.message || "Failed to update default address");
      }
    } catch (error) {
      console.error("Default address update error:", error);
      toast.error("Network error");
    }
  };

  const handleSetCurrentAddress = async (id: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/users/address", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          addressId: id,
          isCurrent: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const updatedAddresses = addresses.map((address) => ({
          ...address,
          SS_IS_CURRENT: address._id === id,
        }));
        setAddresses(updatedAddresses);

        // Update selected address
        const newCurrent = updatedAddresses.find((addr) => addr._id === id);
        if (newCurrent) {
          setSelectedAddress(newCurrent);
        }

        toast.success("Delivery address updated!");
      } else {
        toast.error(result.message || "Failed to update delivery address");
      }
    } catch (error) {
      console.error("Current address update error:", error);
      toast.error("Network error");
    }
  };

  const handleSelectAddress = (address: Address) => {
    setSelectedAddress(address);
  };

  const handleChangeCurrentAddress = async (address: Address) => {
    await handleSetCurrentAddress(address._id);
    toast.success("Current delivery address updated!");
  };

  const handleDeleteClick = (address: Address) => {
    setAddressToDelete(address);
    setShowDeleteModal(true);
  };

  if (isLoading) {
    return (
      <AccountLayout title="My Account" description="Manage your account">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      title="My Account"
      description="Manage your account settings"
    >
      <AddressFormComponent
        showAddressForm={showAddressForm}
        setShowAddressForm={setShowAddressForm}
        editingAddress={editingAddress}
        addressForm={addressForm}
        setAddressForm={setAddressForm}
        isSubmitting={isSubmitting}
        isFetchingPincode={isFetchingPincode}
        userData={userData}
        addresses={addresses}
        handleSaveAddress={handleSaveAddress}
        fetchPincodeDetails={fetchPincodeDetails}
      />

      <DeleteConfirmationModal
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        addressToDelete={addressToDelete}
        handleRemoveAddress={handleRemoveAddress}
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition text-sm sm:text-base ${
            activeTab === "profile"
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-muted"
          }`}
        >
          My Profile
        </button>
        <button
          onClick={() => setActiveTab("address")}
          className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition text-sm sm:text-base ${
            activeTab === "address"
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-muted"
          }`}
        >
          Delivery Address
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Personal Info Section */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg sm:text-xl">Personal Details</h3>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-2">
                  Full Name
                </Label>
                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      value={tempData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      placeholder="First name"
                    />
                    <Input
                      value={tempData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Last name"
                    />
                  </div>
                ) : (
                  <p className="font-semibold text-lg">
                    {userData.firstName} {userData.lastName}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm text-muted-foreground mb-2">
                  Email Address
                </Label>
                <p className="font-semibold text-lg">{userData.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground mb-2">
                  Phone Number
                </Label>
                {isEditing ? (
                  <Input
                    value={tempData.mobileNumber}
                    onChange={(e) =>
                      handleInputChange(
                        "mobileNumber",
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    placeholder="Mobile number"
                    maxLength={10}
                  />
                ) : (
                  <p className="font-semibold text-lg">
                    {userData.mobileNumber}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm text-muted-foreground mb-2">
                  Member Since
                </Label>
                <p className="font-semibold text-lg">{userData.joinDate}</p>
              </div>
            </div>
          </div>

          {/* Account Overview */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-bold mb-6 text-lg sm:text-xl">
              Account Overview
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-primary" />
                  <span>Total Orders</span>
                </div>
                <span className="font-bold">0</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span>Wishlist Items</span>
                </div>
                <span className="font-bold">0</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <span>Saved Addresses</span>
                </div>
                <span className="font-bold">{addresses.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Address Tab */}
      {activeTab === "address" && (
        <div className="space-y-6">
          {/* Current Delivery Address - Always show the ACTUAL current address */}
          {(() => {
            const currentAddress = addresses.find((addr) => addr.SS_IS_CURRENT);
            return currentAddress ? (
              <div className="bg-card border-2 border-primary/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      Current Delivery Address
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      This address will be used for your orders
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded capitalize">
                      {currentAddress.SS_ADDRESS_TYPE}
                    </span>
                    {currentAddress.SS_IS_DEFAULT && (
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        Default
                      </span>
                    )}
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      Current
                    </span>
                  </div>

                  <p className="font-semibold">{currentAddress.SS_FULL_NAME}</p>
                  <p className="text-muted-foreground">
                    {currentAddress.SS_STREET_ADDRESS}
                  </p>
                  <p className="text-muted-foreground">
                    {currentAddress.SS_CITY}, {currentAddress.SS_STATE} -{" "}
                    {currentAddress.SS_POSTAL_CODE}
                  </p>
                  <p className="text-muted-foreground">
                    {currentAddress.SS_COUNTRY}
                  </p>
                  <p className="text-muted-foreground">
                    {currentAddress.SS_MOBILE_NUMBER}
                  </p>
                </div>
              </div>
            ) : null;
          })()}

          {/* All Addresses */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="font-bold text-lg sm:text-xl">All Addresses</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your delivery addresses
                </p>
              </div>
              <Button onClick={handleAddAddress}>
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {addresses.map((address) => (
                <div
                  key={address._id}
                  className={`border rounded-lg p-4 transition-all cursor-pointer ${
                    selectedAddress?._id === address._id
                      ? "border-primary border-2 bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => handleSelectAddress(address)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <input
                      type="radio"
                      name="selectedAddress"
                      checked={selectedAddress?._id === address._id}
                      onChange={() => handleSelectAddress(address)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary mt-1 cursor-pointer"
                      onClick={(e) => e.stopPropagation()} // Prevent double trigger
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded capitalize">
                          {address.SS_ADDRESS_TYPE}
                        </span>
                        {address.SS_IS_DEFAULT && (
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            Default
                          </span>
                        )}
                        {address.SS_IS_CURRENT && (
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="font-semibold">{address.SS_FULL_NAME}</p>
                        <p className="text-muted-foreground">
                          {address.SS_STREET_ADDRESS}
                        </p>
                        <p className="text-muted-foreground">
                          {address.SS_CITY}, {address.SS_STATE} -{" "}
                          {address.SS_POSTAL_CODE}
                        </p>
                        <p className="text-muted-foreground">
                          {address.SS_COUNTRY}
                        </p>
                        <p className="text-muted-foreground">
                          {address.SS_MOBILE_NUMBER}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant={address.SS_IS_CURRENT ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleChangeCurrentAddress(address)}
                      className="text-sm"
                      disabled={address.SS_IS_CURRENT}
                    >
                      {address.SS_IS_CURRENT ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Current Address
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3 h-3 mr-1" />
                          Change as Current Address
                        </>
                      )}
                    </Button>
                    <div className="flex gap-2 ml-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAddress(address)}
                        className="h-8 w-8 p-0"
                        title="Edit address"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      {!address.SS_IS_DEFAULT && addresses.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(address)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Remove address"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {!address.SS_IS_DEFAULT && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetDefaultAddress(address._id);
                      }}
                      className="mt-3 text-sm text-primary hover:underline font-medium"
                    >
                      Set as Default
                    </button>
                  )}
                </div>
              ))}
            </div>

            {addresses.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h4 className="text-lg font-semibold mb-2">
                  No Addresses Added
                </h4>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Add your delivery addresses for faster checkout. You can have
                  multiple addresses for home, work, or other locations.
                </p>
                <Button onClick={handleAddAddress} size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Address
                </Button>
              </div>
            )}
          </div>

          {/* Address Usage Tips */}
          {addresses.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                💡 Address Tips
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Click on any address card or radio button to select it
                </li>
                <li>
                  • Click "Change as Current Address" to make it your delivery
                  address
                </li>
                <li>
                  • You can set one address as default for faster checkout
                </li>
                <li>
                  • Different orders can be delivered to different addresses
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
    </AccountLayout>
  );
}
