import React, { useState, useMemo } from "react";
import { 
  MapPin, 
  Globe, 
  Mail, 
  CheckSquare, 
  Square, 
  X, 
  Plus, 
  Search, 
  Trash2, 
  AlertCircle,
  Layers,
  ChevronDown,
  Info
} from "lucide-react";
import { ALL_INDIAN_STATES, getDistrictsForState } from "../data/indiaStatesAndDistricts";

/**
 * DeliveryRestrictionSelector
 * Allows admin to configure delivery area restrictions for a product:
 * 1. All India (No restriction)
 * 2. By PIN codes (enter specific 6-digit postal codes)
 * 3. By State & Districts checker (checkboxes for districts per state)
 * 4. By Both (PIN codes & Districts)
 */
const DeliveryRestrictionSelector = ({
  restrictionType = "none",
  restrictedPincodes = [],
  restrictedLocations = [],
  onChange,
}) => {
  // Local state for PIN input
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  // Local state for State & District checker
  const [selectedState, setSelectedState] = useState("Jammu & Kashmir");
  const [districtSearchQuery, setDistrictSearchQuery] = useState("");

  // Current mode
  const currentMode = restrictionType || "none";

  // Helper to trigger parent onChange
  const updateRestriction = (newMode, newPins, newLocations) => {
    const isRestricted = newMode !== "none";
    onChange?.({
      isRestricted,
      restrictionType: newMode,
      restrictedPincodes: newPins,
      restrictedLocations: newLocations,
    });
  };

  // Switch mode
  const handleModeChange = (mode) => {
    updateRestriction(mode, restrictedPincodes, restrictedLocations);
  };

  // Add PIN code(s) (handles single or comma/space separated)
  const handleAddPincodes = () => {
    setPinError("");
    if (!pinInput.trim()) return;

    // Split by commas, spaces, or newlines
    const rawCodes = pinInput
      .split(/[\s,]+/)
      .map((c) => c.trim())
      .filter(Boolean);

    const validNewCodes = [];
    const invalidCodes = [];

    rawCodes.forEach((code) => {
      if (/^\d{6}$/.test(code)) {
        if (!restrictedPincodes.includes(code) && !validNewCodes.includes(code)) {
          validNewCodes.push(code);
        }
      } else {
        invalidCodes.push(code);
      }
    });

    if (invalidCodes.length > 0) {
      setPinError(`Invalid 6-digit PIN code(s): ${invalidCodes.slice(0, 3).join(", ")}${invalidCodes.length > 3 ? "..." : ""}`);
    }

    if (validNewCodes.length > 0) {
      const updatedPins = [...restrictedPincodes, ...validNewCodes];
      updateRestriction(currentMode, updatedPins, restrictedLocations);
      setPinInput("");
    }
  };

  const handleRemovePincode = (codeToRemove) => {
    const updatedPins = restrictedPincodes.filter((p) => p !== codeToRemove);
    updateRestriction(currentMode, updatedPins, restrictedLocations);
  };

  const handleClearAllPincodes = () => {
    updateRestriction(currentMode, [], restrictedLocations);
  };

  // Pre-fill Kashmir PINs helper
  const handleAddPresetSrinagar = () => {
    // Standard Srinagar postal pincodes
    const srinagarPins = [
      "190001", "190002", "190003", "190004", "190005",
      "190006", "190007", "190008", "190009", "190010",
      "190011", "190012", "190014", "190015", "190017",
      "190018", "190019", "190020", "190021", "190024"
    ];
    const updatedPins = [...new Set([...restrictedPincodes, ...srinagarPins])];
    updateRestriction(currentMode, updatedPins, restrictedLocations);
  };

  // Districts for current selected state
  const availableDistrictsForState = useMemo(() => {
    return getDistrictsForState(selectedState);
  }, [selectedState]);

  // Filtered districts based on search query
  const filteredDistricts = useMemo(() => {
    if (!districtSearchQuery.trim()) return availableDistrictsForState;
    return availableDistrictsForState.filter((d) =>
      d.toLowerCase().includes(districtSearchQuery.toLowerCase().trim())
    );
  }, [availableDistrictsForState, districtSearchQuery]);

  // Currently selected districts for selectedState
  const currentLocObj = restrictedLocations.find((l) => l.state === selectedState);
  const selectedDistrictsForCurrentState = currentLocObj ? currentLocObj.districts : [];

  // Toggle district checkbox
  const handleToggleDistrict = (districtName) => {
    let updatedLocations = [...restrictedLocations];
    const locIndex = updatedLocations.findIndex((l) => l.state === selectedState);

    if (locIndex >= 0) {
      const existingDistricts = updatedLocations[locIndex].districts;
      let newDistricts;
      if (existingDistricts.includes(districtName)) {
        newDistricts = existingDistricts.filter((d) => d !== districtName);
      } else {
        newDistricts = [...existingDistricts, districtName];
      }

      if (newDistricts.length === 0) {
        // Remove state from locations if no districts are selected
        updatedLocations = updatedLocations.filter((l) => l.state !== selectedState);
      } else {
        updatedLocations[locIndex] = {
          ...updatedLocations[locIndex],
          districts: newDistricts,
        };
      }
    } else {
      // First district added for this state
      updatedLocations.push({
        state: selectedState,
        districts: [districtName],
      });
    }

    updateRestriction(currentMode, restrictedPincodes, updatedLocations);
  };

  // Select all districts for currently viewed state
  const handleSelectAllDistricts = () => {
    let updatedLocations = [...restrictedLocations];
    const locIndex = updatedLocations.findIndex((l) => l.state === selectedState);

    if (locIndex >= 0) {
      updatedLocations[locIndex] = {
        ...updatedLocations[locIndex],
        districts: [...availableDistrictsForState],
      };
    } else {
      updatedLocations.push({
        state: selectedState,
        districts: [...availableDistrictsForState],
      });
    }

    updateRestriction(currentMode, restrictedPincodes, updatedLocations);
  };

  // Deselect all districts for currently viewed state
  const handleDeselectAllDistricts = () => {
    const updatedLocations = restrictedLocations.filter((l) => l.state !== selectedState);
    updateRestriction(currentMode, restrictedPincodes, updatedLocations);
  };

  // Remove an entire configured state
  const handleRemoveState = (stateToRemove) => {
    const updatedLocations = restrictedLocations.filter((l) => l.state !== stateToRemove);
    updateRestriction(currentMode, restrictedPincodes, updatedLocations);
  };

  return (
    <div className="bg-gray-750/60 border border-gray-700 rounded-xl p-4 sm:p-5 text-gray-200 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-700/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">Delivery & Area Restrictions</h4>
            <p className="text-xs text-gray-400">Control which PIN codes or State/Districts can purchase this product</p>
          </div>
        </div>

        {/* Current status indicator */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${
          currentMode === "none" 
            ? "bg-gray-700 text-gray-300"
            : currentMode === "pincodes"
            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
            : currentMode === "districts"
            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${
            currentMode === "none" ? "bg-gray-400" : "bg-emerald-400 animate-pulse"
          }`} />
          {currentMode === "none" && "Nationwide (All India)"}
          {currentMode === "pincodes" && `Restricted to ${restrictedPincodes.length} PINs`}
          {currentMode === "districts" && `Restricted to ${restrictedLocations.length} State(s)`}
          {currentMode === "both" && "Restricted (PINs & Districts)"}
        </span>
      </div>

      {/* Restriction Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Mode 1: All India */}
        <button
          type="button"
          onClick={() => handleModeChange("none")}
          className={`flex flex-col p-3 rounded-lg border text-left transition-all ${
            currentMode === "none"
              ? "bg-emerald-900/30 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/30"
              : "bg-gray-800/80 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <Globe className={`h-4 w-4 ${currentMode === "none" ? "text-emerald-400" : "text-gray-400"}`} />
            <input
              type="radio"
              name="restrictionType"
              checked={currentMode === "none"}
              onChange={() => handleModeChange("none")}
              className="accent-emerald-500 h-3.5 w-3.5"
            />
          </div>
          <span className="text-xs font-semibold text-white">All India</span>
          <span className="text-[11px] text-gray-400 leading-tight mt-0.5">No restriction. Deliverable everywhere.</span>
        </button>

        {/* Mode 2: By PIN Codes */}
        <button
          type="button"
          onClick={() => handleModeChange("pincodes")}
          className={`flex flex-col p-3 rounded-lg border text-left transition-all ${
            currentMode === "pincodes"
              ? "bg-emerald-900/30 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/30"
              : "bg-gray-800/80 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <Mail className={`h-4 w-4 ${currentMode === "pincodes" ? "text-emerald-400" : "text-gray-400"}`} />
            <input
              type="radio"
              name="restrictionType"
              checked={currentMode === "pincodes"}
              onChange={() => handleModeChange("pincodes")}
              className="accent-emerald-500 h-3.5 w-3.5"
            />
          </div>
          <span className="text-xs font-semibold text-white">Set of PIN Codes</span>
          <span className="text-[11px] text-gray-400 leading-tight mt-0.5">Restrict delivery to specific postal PINs.</span>
        </button>

        {/* Mode 3: State & District Checker */}
        <button
          type="button"
          onClick={() => handleModeChange("districts")}
          className={`flex flex-col p-3 rounded-lg border text-left transition-all ${
            currentMode === "districts"
              ? "bg-emerald-900/30 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/30"
              : "bg-gray-800/80 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <CheckSquare className={`h-4 w-4 ${currentMode === "districts" ? "text-emerald-400" : "text-gray-400"}`} />
            <input
              type="radio"
              name="restrictionType"
              checked={currentMode === "districts"}
              onChange={() => handleModeChange("districts")}
              className="accent-emerald-500 h-3.5 w-3.5"
            />
          </div>
          <span className="text-xs font-semibold text-white">State & Districts</span>
          <span className="text-[11px] text-gray-400 leading-tight mt-0.5">Checkbox selection for districts per state.</span>
        </button>

        {/* Mode 4: Both */}
        <button
          type="button"
          onClick={() => handleModeChange("both")}
          className={`flex flex-col p-3 rounded-lg border text-left transition-all ${
            currentMode === "both"
              ? "bg-emerald-900/30 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/30"
              : "bg-gray-800/80 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <Layers className={`h-4 w-4 ${currentMode === "both" ? "text-emerald-400" : "text-gray-400"}`} />
            <input
              type="radio"
              name="restrictionType"
              checked={currentMode === "both"}
              onChange={() => handleModeChange("both")}
              className="accent-emerald-500 h-3.5 w-3.5"
            />
          </div>
          <span className="text-xs font-semibold text-white">PINs + Districts</span>
          <span className="text-[11px] text-gray-400 leading-tight mt-0.5">Allow matching PINs OR matching districts.</span>
        </button>
      </div>

      {/* ======================= PIN CODES SECTION ======================= */}
      {(currentMode === "pincodes" || currentMode === "both") && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              <Mail className="h-4 w-4" />
              Allowed PIN Codes ({restrictedPincodes.length})
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddPresetSrinagar}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded transition"
                title="Quickly add standard Srinagar PIN codes (190001 - 190024)"
              >
                + Add Srinagar PINs
              </button>
              {restrictedPincodes.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllPincodes}
                  className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Clear All
                </button>
              )}
            </div>
          </div>

          {/* Input field + Add button */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Enter 6-digit PIN code(s), e.g., 190001, 190002"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (pinError) setPinError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddPincodes();
                  }
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAddPincodes}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-1 transition"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>

          {pinError && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {pinError}
            </p>
          )}

          {/* List of PIN badges */}
          {restrictedPincodes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-gray-900/50 rounded-md border border-gray-700/60">
              {restrictedPincodes.map((pin) => (
                <span
                  key={pin}
                  className="inline-flex items-center gap-1 bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs px-2.5 py-1 rounded-full font-mono"
                >
                  {pin}
                  <button
                    type="button"
                    onClick={() => handleRemovePincode(pin)}
                    className="hover:text-red-400 focus:outline-none ml-0.5"
                    aria-label={`Remove ${pin}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className="text-xs text-amber-400/90 bg-amber-950/30 border border-amber-800/40 p-2.5 rounded-md flex items-center gap-2">
              <Info className="h-4 w-4 flex-shrink-0" />
              <span>No PIN codes added yet. Enter one or more 6-digit PIN codes above to restrict delivery.</span>
            </div>
          )}
        </div>
      )}

      {/* ================== STATE & DISTRICT CHECKER SECTION ================== */}
      {(currentMode === "districts" || currentMode === "both") && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              <CheckSquare className="h-4 w-4" />
              State & District Checker
            </div>

            {/* Configured States Counter */}
            <span className="text-xs text-gray-400">
              {restrictedLocations.length > 0 ? (
                <>Configured for <strong className="text-white">{restrictedLocations.length}</strong> state(s)</>
              ) : (
                "Select a state and check districts below"
              )}
            </span>
          </div>

          {/* State Selector Dropdown & District Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Select State / Union Territory
              </label>
              <div className="relative">
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setDistrictSearchQuery("");
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none pr-8 cursor-pointer"
                >
                  {ALL_INDIAN_STATES.map((s) => {
                    const hasSelected = restrictedLocations.some((l) => l.state === s && l.districts.length > 0);
                    return (
                      <option key={s} value={s}>
                        {s} {hasSelected ? "✓" : ""}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="h-4 w-4 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Filter Districts in {selectedState}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search ${availableDistrictsForState.length} districts...`}
                  value={districtSearchQuery}
                  onChange={(e) => setDistrictSearchQuery(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="h-4 w-4 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* District Action Buttons & Counter */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-750">
            <div className="text-xs text-gray-300">
              <span className="font-semibold text-emerald-400">
                {selectedDistrictsForCurrentState.length}
              </span> of {availableDistrictsForState.length} districts checked in <strong className="text-white">{selectedState}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllDistricts}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2.5 py-1 rounded transition"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAllDistricts}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-gray-200 px-2.5 py-1 rounded transition"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* District Checkboxes Grid */}
          <div className="bg-gray-900/60 border border-gray-700/80 rounded-lg p-3 max-h-56 overflow-y-auto">
            {filteredDistricts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {filteredDistricts.map((district) => {
                  const isChecked = selectedDistrictsForCurrentState.includes(district);
                  return (
                    <label
                      key={district}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs cursor-pointer border transition-colors select-none ${
                        isChecked
                          ? "bg-emerald-950/70 border-emerald-600/80 text-emerald-200 font-medium"
                          : "bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleDistrict(district)}
                        className="rounded border-gray-600 text-emerald-600 focus:ring-emerald-500 accent-emerald-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span className="truncate" title={district}>{district}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">
                No districts found matching "{districtSearchQuery}" in {selectedState}.
              </p>
            )}
          </div>

          {/* Summary of ALL configured states & districts */}
          {restrictedLocations.length > 0 && (
            <div className="pt-2 border-t border-gray-750 space-y-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                All Configured States & Districts:
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {restrictedLocations.map((loc) => (
                  <div
                    key={loc.state}
                    className="flex flex-col sm:flex-row sm:items-start justify-between bg-gray-900/80 border border-gray-700/70 rounded-md p-2.5 gap-2 text-xs"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-emerald-400">{loc.state}</strong>
                        <span className="text-[11px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">
                          {loc.districts.length} district(s)
                        </span>
                      </div>
                      <p className="text-gray-400 text-[11px] mt-1 line-clamp-2">
                        {loc.districts.join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedState(loc.state);
                          setDistrictSearchQuery("");
                        }}
                        className="text-[11px] text-emerald-400 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveState(loc.state)}
                        className="text-[11px] text-red-400 hover:text-red-300"
                        title={`Remove ${loc.state}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryRestrictionSelector;
