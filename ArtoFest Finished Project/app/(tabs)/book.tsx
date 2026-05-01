import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import Footer from "../../components/footer";
import { theme } from "../../lib/theme";

type Option = {
  label: string;
  value: string;
};

type DistanceOption = {
  label: string;
  value: string;
  maxKm: number | null;
};

type TravelOption = {
  id: string;
  provider: string;
  type: string;
  departure: string;
  duration: string;
  notes: string;
  price: string;
};

type AccommodationOption = {
  id: string;
  name: string;
  type: string;
  rating: string;
  reviews: string;
  location: string;
  distanceKm: number;
  perks: string[];
  pricePerNight: string;
  totalPrice: string;
  imageUrl: string;
};

type DropdownId =
  | "from"
  | "to"
  | "departure"
  | "return"
  | "guests"
  | "distance"
  | "property-type";

type DropdownButtonProps = {
  label: string;
  selectedLabel: string;
  onPress: () => void;
};

const fromOptions: Option[] = [
  { label: "London, United Kingdom", value: "london-uk" },
  { label: "Plymouth, United Kingdom", value: "plymouth-uk" },
  { label: "Bristol, United Kingdom", value: "bristol-uk" },
  { label: "Manchester, United Kingdom", value: "manchester-uk" },
  { label: "Birmingham, United Kingdom", value: "birmingham-uk" },
  { label: "Leeds, United Kingdom", value: "leeds-uk" },
  { label: "Exeter, United Kingdom", value: "exeter-uk" },
  { label: "Cardiff, United Kingdom", value: "cardiff-uk" },
  { label: "Glasgow, United Kingdom", value: "glasgow-uk" },
  { label: "Newcastle, United Kingdom", value: "newcastle-uk" },
  { label: "Liverpool, United Kingdom", value: "liverpool-uk" },
  { label: "Brighton, United Kingdom", value: "brighton-uk" },
  { label: "Southampton, United Kingdom", value: "southampton-uk" },
  { label: "Nottingham, United Kingdom", value: "nottingham-uk" },
  { label: "Edinburgh, United Kingdom", value: "edinburgh-uk" },
];

const destinationOptions: Option[] = [
  { label: "Rome, Italy", value: "rome-it" },
  { label: "Berlin, Germany", value: "berlin-de" },
  { label: "Lisbon, Portugal", value: "lisbon-pt" },
  { label: "Paris, France", value: "paris-fr" },
  { label: "Amsterdam, Netherlands", value: "amsterdam-nl" },
  { label: "Barcelona, Spain", value: "barcelona-es" },
  { label: "Prague, Czech Republic", value: "prague-cz" },
  { label: "Vienna, Austria", value: "vienna-at" },
  { label: "Dublin, Ireland", value: "dublin-ie" },
  { label: "Copenhagen, Denmark", value: "copenhagen-dk" },
  { label: "Budapest, Hungary", value: "budapest-hu" },
  { label: "Warsaw, Poland", value: "warsaw-pl" },
  { label: "Athens, Greece", value: "athens-gr" },
  { label: "Brussels, Belgium", value: "brussels-be" },
  { label: "Stockholm, Sweden", value: "stockholm-se" },
];

const departureDateOptions: Option[] = [
  { label: "12 May 2026", value: "2026-05-12" },
  { label: "18 May 2026", value: "2026-05-18" },
  { label: "24 May 2026", value: "2026-05-24" },
  { label: "02 June 2026", value: "2026-06-02" },
  { label: "10 June 2026", value: "2026-06-10" },
  { label: "18 June 2026", value: "2026-06-18" },
  { label: "26 June 2026", value: "2026-06-26" },
  { label: "04 July 2026", value: "2026-07-04" },
  { label: "12 July 2026", value: "2026-07-12" },
  { label: "20 July 2026", value: "2026-07-20" },
  { label: "28 July 2026", value: "2026-07-28" },
  { label: "05 August 2026", value: "2026-08-05" },
  { label: "13 August 2026", value: "2026-08-13" },
  { label: "21 August 2026", value: "2026-08-21" },
  { label: "30 August 2026", value: "2026-08-30" },
];

const returnDateOptions: Option[] = [
  { label: "15 May 2026", value: "2026-05-15" },
  { label: "21 May 2026", value: "2026-05-21" },
  { label: "27 May 2026", value: "2026-05-27" },
  { label: "05 June 2026", value: "2026-06-05" },
  { label: "13 June 2026", value: "2026-06-13" },
  { label: "22 June 2026", value: "2026-06-22" },
  { label: "30 June 2026", value: "2026-06-30" },
  { label: "08 July 2026", value: "2026-07-08" },
  { label: "16 July 2026", value: "2026-07-16" },
  { label: "24 July 2026", value: "2026-07-24" },
  { label: "01 August 2026", value: "2026-08-01" },
  { label: "09 August 2026", value: "2026-08-09" },
  { label: "17 August 2026", value: "2026-08-17" },
  { label: "25 August 2026", value: "2026-08-25" },
  { label: "03 September 2026", value: "2026-09-03" },
];

const guestOptions: Option[] = [
  { label: "1 Adult", value: "1-adult" },
  { label: "2 Adults", value: "2-adults" },
  { label: "3 Adults", value: "3-adults" },
  { label: "4 Adults", value: "4-adults" },
  { label: "2 Adults, 1 Child", value: "2-adults-1-child" },
  { label: "2 Adults, 2 Children", value: "2-adults-2-children" },
  { label: "1 Adult, 1 Child", value: "1-adult-1-child" },
  { label: "3 Adults, 1 Child", value: "3-adults-1-child" },
  { label: "4 Adults, 2 Children", value: "4-adults-2-children" },
  { label: "6 Adults", value: "6-adults" },
  { label: "Group of 8", value: "group-8" },
  { label: "Group of 10", value: "group-10" },
  { label: "Family of 3", value: "family-3" },
  { label: "Family of 4", value: "family-4" },
  { label: "Family of 5", value: "family-5" },
];

const distanceOptions: DistanceOption[] = [
  { label: "Any distance", value: "any", maxKm: null },
  { label: "Within 1 km", value: "1km", maxKm: 1 },
  { label: "Within 2 km", value: "2km", maxKm: 2 },
  { label: "Within 3 km", value: "3km", maxKm: 3 },
  { label: "Within 5 km", value: "5km", maxKm: 5 },
  { label: "Within 7 km", value: "7km", maxKm: 7 },
  { label: "Within 10 km", value: "10km", maxKm: 10 },
  { label: "Within 12 km", value: "12km", maxKm: 12 },
  { label: "Within 15 km", value: "15km", maxKm: 15 },
  { label: "Within 20 km", value: "20km", maxKm: 20 },
  { label: "Within 25 km", value: "25km", maxKm: 25 },
  { label: "Within 30 km", value: "30km", maxKm: 30 },
];

const propertyTypeOptions: Option[] = [
  { label: "All property types", value: "all" },
  { label: "Hotel", value: "Hotel" },
  { label: "Apartment", value: "Apartment" },
  { label: "Hostel", value: "Hostel" },
  { label: "Guest House", value: "Guest House" },
  { label: "Villa", value: "Villa" },
  { label: "Resort", value: "Resort" },
  { label: "Boutique Hotel", value: "Boutique Hotel" },
  { label: "Aparthotel", value: "Aparthotel" },
  { label: "Bed & Breakfast", value: "Bed & Breakfast" },
  { label: "Cabin", value: "Cabin" },
  { label: "Studio", value: "Studio" },
  { label: "Serviced Apartment", value: "Serviced Apartment" },
  { label: "Budget Hotel", value: "Budget Hotel" },
  { label: "Luxury Hotel", value: "Luxury Hotel" },
];

const travelOptions: TravelOption[] = [
  {
    id: "travel-1",
    provider: "Ryanair",
    type: "Flight",
    departure: "07:30 - 11:00",
    duration: "2h 30m",
    notes: "Budget mock flight with cabin baggage only.",
    price: "£89",
  },
  {
    id: "travel-2",
    provider: "easyJet",
    type: "Flight",
    departure: "09:15 - 12:40",
    duration: "2h 25m",
    notes: "Morning mock flight with standard seating.",
    price: "£105",
  },
  {
    id: "travel-3",
    provider: "British Airways",
    type: "Flight",
    departure: "12:10 - 15:40",
    duration: "2h 30m",
    notes: "Mock premium short-haul option.",
    price: "£148",
  },
  {
    id: "travel-4",
    provider: "Lufthansa",
    type: "Flight + connection",
    departure: "06:40 - 13:30",
    duration: "5h 50m",
    notes: "Mock connecting route via Frankfurt.",
    price: "£165",
  },
  {
    id: "travel-5",
    provider: "KLM",
    type: "Flight + connection",
    departure: "10:00 - 16:20",
    duration: "5h 20m",
    notes: "Mock connection with checked baggage included.",
    price: "£179",
  },
  {
    id: "travel-6",
    provider: "Eurostar + Rail Europe",
    type: "Train",
    departure: "06:00 - 18:00",
    duration: "12h",
    notes: "Mock rail journey with multiple changes.",
    price: "£150",
  },
  {
    id: "travel-7",
    provider: "National Express + partner coach",
    type: "Coach",
    departure: "05:30 - 23:45",
    duration: "18h 15m",
    notes: "Low-cost mock coach option.",
    price: "£95",
  },
  {
    id: "travel-8",
    provider: "FlixBus Europe",
    type: "Coach",
    departure: "08:20 - 01:10",
    duration: "16h 50m",
    notes: "Mock coach with transfer stop.",
    price: "£110",
  },
  {
    id: "travel-9",
    provider: "ArtoFest Express",
    type: "Festival Shuttle",
    departure: "11:00 - 17:30",
    duration: "6h 30m",
    notes: "Mock branded shuttle for concept demonstration.",
    price: "£129",
  },
  {
    id: "travel-10",
    provider: "Mixed Mode Saver",
    type: "Rail + coach",
    departure: "07:00 - 19:10",
    duration: "12h 10m",
    notes: "Mock saver route using multiple transport modes.",
    price: "£119",
  },
  {
    id: "travel-11",
    provider: "Air France",
    type: "Flight + connection",
    departure: "13:25 - 19:10",
    duration: "4h 45m",
    notes: "Mock connecting route through Paris.",
    price: "£172",
  },
  {
    id: "travel-12",
    provider: "Wizz Air",
    type: "Flight",
    departure: "16:30 - 20:05",
    duration: "2h 35m",
    notes: "Mock evening flight with basic fare.",
    price: "£76",
  },
  {
    id: "travel-13",
    provider: "Iberia",
    type: "Flight + connection",
    departure: "08:50 - 15:15",
    duration: "5h 25m",
    notes: "Mock route with a short layover.",
    price: "£188",
  },
  {
    id: "travel-14",
    provider: "City Night Rail",
    type: "Night train",
    departure: "19:40 - 09:20",
    duration: "13h 40m",
    notes: "Mock overnight rail option.",
    price: "£138",
  },
  {
    id: "travel-15",
    provider: "Festival Weekend Coach",
    type: "Coach",
    departure: "22:00 - 14:15",
    duration: "16h 15m",
    notes: "Mock overnight coach for festival travellers.",
    price: "£82",
  },
  {
    id: "travel-16",
    provider: "GreenRoute Rail",
    type: "Train",
    departure: "09:30 - 21:40",
    duration: "12h 10m",
    notes: "Mock lower-emission rail route.",
    price: "£161",
  },
];

const accommodationOptions: AccommodationOption[] = [
  {
    id: "acc-1",
    name: "The Grand Rome Hotel",
    type: "Hotel",
    rating: "4.5",
    reviews: "512 reviews",
    location: "Central district",
    distanceKm: 0.5,
    perks: ["Free Wi-Fi", "Breakfast", "Free cancellation"],
    pricePerNight: "£120 / night",
    totalPrice: "£360 total",
    imageUrl:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "acc-2",
    name: "City Inn Rome",
    type: "Hotel",
    rating: "4.2",
    reviews: "324 reviews",
    location: "Near main station",
    distanceKm: 1.2,
    perks: ["Free Wi-Fi", "Breakfast", "Near transport"],
    pricePerNight: "£95 / night",
    totalPrice: "£285 total",
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "acc-3",
    name: "Roma Suites & Apartments",
    type: "Apartment",
    rating: "4.6",
    reviews: "215 reviews",
    location: "Arts quarter",
    distanceKm: 0.8,
    perks: ["Kitchen", "Free Wi-Fi", "Self check-in"],
    pricePerNight: "£150 / night",
    totalPrice: "£450 total",
    imageUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "acc-4",
    name: "The Colosseum View Hotel",
    type: "Boutique Hotel",
    rating: "4.7",
    reviews: "430 reviews",
    location: "Historic centre",
    distanceKm: 1.3,
    perks: ["Free Wi-Fi", "Breakfast", "City view"],
    pricePerNight: "£180 / night",
    totalPrice: "£540 total",
    imageUrl:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "acc-5",
    name: "Festival Hostel Roma",
    type: "Hostel",
    rating: "4.0",
    reviews: "198 reviews",
    location: "Student district",
    distanceKm: 2.8,
    perks: ["Shared kitchen", "Lockers", "Late check-in"],
    pricePerNight: "£42 / night",
    totalPrice: "£126 total",
    imageUrl:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "acc-6",
    name: "Villa Aurora Stay",
    type: "Villa",
    rating: "4.8",
    reviews: "144 reviews",
    location: "Hillside area",
    distanceKm: 6.4,
    perks: ["Pool", "Garden", "Private parking"],
    pricePerNight: "£210 / night",
    totalPrice: "£630 total",
    imageUrl:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "acc-7",
    name: "Roma Riverside Resort",
    type: "Resort",
    rating: "4.4",
    reviews: "267 reviews",
    location: "Riverfront",
    distanceKm: 4.1,
    perks: ["Spa", "Breakfast", "Fitness suite"],
    pricePerNight: "£175 / night",
    totalPrice: "£525 total",
    imageUrl:
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "acc-8",
    name: "Arto Aparthotel Central",
    type: "Aparthotel",
    rating: "4.3",
    reviews: "301 reviews",
    location: "City centre",
    distanceKm: 1.9,
    perks: ["Kitchenette", "Wi-Fi", "Laundry"],
    pricePerNight: "£134 / night",
    totalPrice: "£402 total",
    imageUrl:
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "acc-9",
    name: "Old Town Guest House",
    type: "Guest House",
    rating: "4.1",
    reviews: "168 reviews",
    location: "Old town",
    distanceKm: 2.1,
    perks: ["Breakfast", "Family rooms", "Free Wi-Fi"],
    pricePerNight: "£88 / night",
    totalPrice: "£264 total",
    imageUrl:
      "https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "acc-10",
    name: "Festival Cabin Retreat",
    type: "Cabin",
    rating: "4.2",
    reviews: "119 reviews",
    location: "Quiet outskirts",
    distanceKm: 9.7,
    perks: ["Self-catering", "Parking", "Outdoor terrace"],
    pricePerNight: "£112 / night",
    totalPrice: "£336 total",
    imageUrl:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "acc-11",
    name: "Budget Stay Central",
    type: "Budget Hotel",
    rating: "3.9",
    reviews: "287 reviews",
    location: "Market district",
    distanceKm: 2.4,
    perks: ["Wi-Fi", "24-hour desk", "Budget rooms"],
    pricePerNight: "£68 / night",
    totalPrice: "£204 total",
    imageUrl:
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "acc-12",
    name: "Festival Studio Stay",
    type: "Studio",
    rating: "4.4",
    reviews: "203 reviews",
    location: "Creative quarter",
    distanceKm: 1.6,
    perks: ["Kitchenette", "Self check-in", "Workspace"],
    pricePerNight: "£118 / night",
    totalPrice: "£354 total",
    imageUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "acc-13",
    name: "Palazzo Luxury Hotel",
    type: "Luxury Hotel",
    rating: "4.9",
    reviews: "612 reviews",
    location: "Historic centre",
    distanceKm: 0.9,
    perks: ["Spa", "Concierge", "Fine dining"],
    pricePerNight: "£260 / night",
    totalPrice: "£780 total",
    imageUrl:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "acc-14",
    name: "Artist Loft Apartment",
    type: "Serviced Apartment",
    rating: "4.6",
    reviews: "185 reviews",
    location: "Arts quarter",
    distanceKm: 0.7,
    perks: ["Kitchen", "Laundry", "Balcony"],
    pricePerNight: "£145 / night",
    totalPrice: "£435 total",
    imageUrl:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "acc-15",
    name: "Riverside Bed & Breakfast",
    type: "Bed & Breakfast",
    rating: "4.5",
    reviews: "241 reviews",
    location: "Riverside area",
    distanceKm: 3.2,
    perks: ["Breakfast", "Local host", "Free Wi-Fi"],
    pricePerNight: "£92 / night",
    totalPrice: "£276 total",
    imageUrl:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "acc-16",
    name: "Metro Link Hotel",
    type: "Hotel",
    rating: "4.0",
    reviews: "356 reviews",
    location: "Transport hub",
    distanceKm: 5.6,
    perks: ["Metro nearby", "Wi-Fi", "Late checkout"],
    pricePerNight: "£84 / night",
    totalPrice: "£252 total",
    imageUrl:
      "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=800&q=80",
  },
];

function getOptionLabel(options: Option[], value: string) {
  return options.find((item) => item.value === value)?.label || "";
}

function getDistanceLabel(value: string) {
  return distanceOptions.find((item) => item.value === value)?.label || "";
}

function DropdownButton({ label, selectedLabel, onPress }: DropdownButtonProps) {
  return (
    <View style={styles.dropdownField}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <Pressable style={styles.dropdownButton} onPress={onPress}>
        <Text style={styles.dropdownButtonText} numberOfLines={1}>
          {selectedLabel}
        </Text>
        <Text style={styles.dropdownArrow}>▾</Text>
      </Pressable>
    </View>
  );
}

export default function BookScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isWide = width >= 950;
  const isMedium = width >= 720;

  const [activeDropdown, setActiveDropdown] = useState<DropdownId | null>(null);

  const [from, setFrom] = useState(fromOptions[0].value);
  const [destination, setDestination] = useState(destinationOptions[0].value);
  const [departureDate, setDepartureDate] = useState(departureDateOptions[0].value);
  const [returnDate, setReturnDate] = useState(returnDateOptions[0].value);
  const [guests, setGuests] = useState(guestOptions[1].value);
  const [selectedDistance, setSelectedDistance] = useState(distanceOptions[0].value);
  const [selectedPropertyType, setSelectedPropertyType] = useState(
    propertyTypeOptions[0].value
  );

  const fromLabel = getOptionLabel(fromOptions, from);
  const destinationLabel = getOptionLabel(destinationOptions, destination);
  const departureDateLabel = getOptionLabel(departureDateOptions, departureDate);
  const returnDateLabel = getOptionLabel(returnDateOptions, returnDate);
  const guestsLabel = getOptionLabel(guestOptions, guests);
  const distanceLabel = getDistanceLabel(selectedDistance);
  const propertyTypeLabel = getOptionLabel(propertyTypeOptions, selectedPropertyType);

  const cardWidth = isWide ? "48.8%" : "100%";
  const resultsWidth = isWide ? "74%" : "100%";
  const filterWidth = isWide ? "23%" : "100%";

  const distanceSelectOptions = useMemo<Option[]>(() => {
    return distanceOptions.map((item) => ({
      label: item.label,
      value: item.value,
    }));
  }, []);

  const filteredAccommodation = useMemo(() => {
    const distanceRule =
      distanceOptions.find((item) => item.value === selectedDistance)?.maxKm ?? null;

    return accommodationOptions.filter((option) => {
      const propertyMatch =
        selectedPropertyType === "all" || option.type === selectedPropertyType;

      const distanceMatch =
        distanceRule === null ? true : option.distanceKm <= distanceRule;

      return propertyMatch && distanceMatch;
    });
  }, [selectedDistance, selectedPropertyType]);

  const activeDropdownConfig = useMemo(() => {
    if (!activeDropdown) return null;

    switch (activeDropdown) {
      case "from":
        return {
          title: "From",
          value: from,
          options: fromOptions,
        };

      case "to":
        return {
          title: "To",
          value: destination,
          options: destinationOptions,
        };

      case "departure":
        return {
          title: "Departure Date",
          value: departureDate,
          options: departureDateOptions,
        };

      case "return":
        return {
          title: "Return Date",
          value: returnDate,
          options: returnDateOptions,
        };

      case "guests":
        return {
          title: "Guests",
          value: guests,
          options: guestOptions,
        };

      case "distance":
        return {
          title: "Distance",
          value: selectedDistance,
          options: distanceSelectOptions,
        };

      case "property-type":
        return {
          title: "Property Type",
          value: selectedPropertyType,
          options: propertyTypeOptions,
        };

      default:
        return null;
    }
  }, [
    activeDropdown,
    departureDate,
    destination,
    distanceSelectOptions,
    from,
    guests,
    returnDate,
    selectedDistance,
    selectedPropertyType,
  ]);

  function goToUnavailable() {
    router.push("/booking-unavailable" as any);
  }

  function handleDropdownSelect(value: string) {
    if (!activeDropdown) return;

    switch (activeDropdown) {
      case "from":
        setFrom(value);
        break;

      case "to":
        setDestination(value);
        break;

      case "departure":
        setDepartureDate(value);
        break;

      case "return":
        setReturnDate(value);
        break;

      case "guests":
        setGuests(value);
        break;

      case "distance":
        setSelectedDistance(value);
        break;

      case "property-type":
        setSelectedPropertyType(value);
        break;
    }

    setActiveDropdown(null);
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.scrollInner}>
          <View style={styles.page}>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>Proof-of-concept booking</Text>
              <Text style={styles.heroTitle}>Book Travel</Text>
              <Text style={styles.heroSubtitle}>
                Explore mock travel and accommodation options for your festival
                trip. This page demonstrates the intended booking journey without
                connecting to paid travel services.
              </Text>
            </View>

            <View style={styles.searchPanel}>
              <View style={styles.dropdownGrid}>
                <View style={{ width: isWide ? "49.2%" : "100%" }}>
                  <DropdownButton
                    label="From"
                    selectedLabel={fromLabel}
                    onPress={() => setActiveDropdown("from")}
                  />
                </View>

                <View style={{ width: isWide ? "49.2%" : "100%" }}>
                  <DropdownButton
                    label="To"
                    selectedLabel={destinationLabel}
                    onPress={() => setActiveDropdown("to")}
                  />
                </View>

                <View style={{ width: isWide ? "32.4%" : "100%" }}>
                  <DropdownButton
                    label="Departure Date"
                    selectedLabel={departureDateLabel}
                    onPress={() => setActiveDropdown("departure")}
                  />
                </View>

                <View style={{ width: isWide ? "32.4%" : "100%" }}>
                  <DropdownButton
                    label="Return Date"
                    selectedLabel={returnDateLabel}
                    onPress={() => setActiveDropdown("return")}
                  />
                </View>

                <View style={{ width: isWide ? "32.4%" : "100%" }}>
                  <DropdownButton
                    label="Guests"
                    selectedLabel={guestsLabel}
                    onPress={() => setActiveDropdown("guests")}
                  />
                </View>
              </View>

              <Pressable style={styles.searchButton} onPress={goToUnavailable}>
                <Text style={styles.searchButtonText}>Search Travel</Text>
              </Pressable>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Travel options</Text>
              <Text style={styles.sectionSubtitle}>
                Mock routes from {fromLabel} to {destinationLabel} for{" "}
                {departureDateLabel}. Return date: {returnDateLabel}. Travellers:{" "}
                {guestsLabel}.
              </Text>
            </View>

            <View style={styles.travelGrid}>
              {travelOptions.map((option) => (
                <View key={option.id} style={[styles.travelCard, { width: cardWidth }]}>
                  <View style={styles.travelCardTopRow}>
                    <View style={styles.providerBlock}>
                      <Text style={styles.providerName} numberOfLines={2}>
                        {option.provider}
                      </Text>
                      <Text style={styles.transportType}>{option.type}</Text>
                    </View>

                    <Text style={styles.travelPrice} numberOfLines={1}>
                      {option.price}
                    </Text>
                  </View>

                  <View style={styles.travelInfoRow}>
                    <View style={styles.travelInfoBlock}>
                      <Text style={styles.travelInfoLabel}>Departure</Text>
                      <Text style={styles.travelInfoValue}>{option.departure}</Text>
                    </View>

                    <View style={styles.travelInfoBlock}>
                      <Text style={styles.travelInfoLabel}>Duration</Text>
                      <Text style={styles.travelInfoValue}>{option.duration}</Text>
                    </View>
                  </View>

                  <Text style={styles.travelNotes}>
                    {option.notes} Route shown for {fromLabel} to {destinationLabel}.
                  </Text>

                  <Pressable style={styles.cardActionButton} onPress={goToUnavailable}>
                    <Text style={styles.cardActionButtonText}>Book</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={styles.bestTimeCard}>
              <View style={styles.bestTimeTextWrap}>
                <Text style={styles.bestTimeTitle}>Best time to travel</Text>
                <Text style={styles.bestTimeText}>
                  Cheapest mock month for this route: May
                </Text>
              </View>

              <View style={styles.bestTimePricePill}>
                <Text style={styles.bestTimePrice}>from £89</Text>
              </View>
            </View>

            <View style={styles.accommodationIntro}>
              <Text style={styles.accommodationTitle}>Accommodation</Text>
              <Text style={styles.accommodationSubtitle}>
                Find mock places to stay near your festival destination.
              </Text>
            </View>

            <View
              style={[
                styles.accommodationArea,
                { flexDirection: isWide ? "row" : "column" },
              ]}
            >
              <View style={[styles.filterPanel, { width: filterWidth }]}>
                <Text style={styles.filterTitle}>Filter Results</Text>

                <DropdownButton
                  label="Distance"
                  selectedLabel={distanceLabel}
                  onPress={() => setActiveDropdown("distance")}
                />

                <DropdownButton
                  label="Property Type"
                  selectedLabel={propertyTypeLabel}
                  onPress={() => setActiveDropdown("property-type")}
                />
              </View>

              <View style={[styles.accommodationResults, { width: resultsWidth }]}>
                <Text style={styles.resultsCount}>
                  {filteredAccommodation.length} mock properties found near{" "}
                  {destinationLabel} · {distanceLabel} · {propertyTypeLabel}
                </Text>

                {filteredAccommodation.length === 0 ? (
                  <View style={styles.noResultsBox}>
                    <Text style={styles.noResultsTitle}>No mock stays found</Text>
                    <Text style={styles.noResultsText}>
                      Try changing the distance or property type filter.
                    </Text>
                  </View>
                ) : null}

                {filteredAccommodation.map((option) => (
                  <View
                    key={option.id}
                    style={[
                      styles.accommodationCard,
                      { flexDirection: isMedium ? "row" : "column" },
                    ]}
                  >
                    <Image
                      source={{ uri: option.imageUrl }}
                      style={[
                        styles.accommodationImage,
                        { width: isMedium ? 190 : "100%" },
                      ]}
                      resizeMode="cover"
                    />

                    <View style={styles.accommodationDetails}>
                      <Text style={styles.hotelName}>{option.name}</Text>
                      <Text style={styles.hotelMeta}>
                        ★ {option.rating} ({option.reviews}) · {option.type}
                      </Text>
                      <Text style={styles.hotelLocation}>
                        {option.distanceKm.toFixed(1)} km from festival area ·{" "}
                        {option.location}
                      </Text>

                      <View style={styles.perkRow}>
                        {option.perks.map((perk) => (
                          <View key={perk} style={styles.perkPill}>
                            <Text style={styles.perkText}>{perk}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    <View style={styles.priceColumn}>
                      <Text style={styles.hotelPrice}>{option.pricePerNight}</Text>
                      <Text style={styles.hotelTotal}>{option.totalPrice}</Text>

                      <Pressable
                        style={styles.dealButton}
                        onPress={goToUnavailable}
                      >
                        <Text style={styles.dealButtonText}>View Deal</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <Footer />
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={activeDropdown !== null}
        animationType="fade"
        onRequestClose={() => setActiveDropdown(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setActiveDropdown(null)}
          />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeDropdownConfig?.title || "Select option"}
              </Text>

              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setActiveDropdown(null)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalOptionsScroll} showsVerticalScrollIndicator>
              {activeDropdownConfig?.options.map((option) => {
                const isSelected = option.value === activeDropdownConfig.value;

                return (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.modalOption,
                      isSelected ? styles.modalOptionSelected : null,
                    ]}
                    onPress={() => handleDropdownSelect(option.value)}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected ? styles.modalOptionTextSelected : null,
                      ]}
                    >
                      {option.label}
                    </Text>

                    {isSelected ? (
                      <Text style={styles.modalOptionCheck}>✓</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  scrollInner: {
    flexGrow: 1,
    justifyContent: "space-between",
  },

  page: {
    width: "100%",
    maxWidth: 1980,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 28,
  },

  hero: {
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 26,
  },

  eyebrow: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  heroTitle: {
    color: theme.colors.primary,
    fontSize: 52,
    lineHeight: 58,
    fontWeight: "900",
    marginTop: 8,
  },

  heroSubtitle: {
    color: theme.colors.textMuted,
    marginTop: 12,
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 760,
  },

  searchPanel: {
    marginTop: 22,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 18,
  },

  dropdownGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  dropdownField: {
    marginBottom: 14,
  },

  fieldLabel: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 8,
  },

  dropdownButton: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
    paddingRight: 12,
  },

  dropdownArrow: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },

  searchButton: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 13,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  searchButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },

  sectionHeaderRow: {
    marginTop: 30,
    marginBottom: 14,
  },

  sectionTitle: {
    color: theme.colors.primary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: theme.colors.textMuted,
    marginTop: 5,
    fontSize: 15,
    lineHeight: 23,
  },

  travelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  travelCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 18,
    marginBottom: 16,
    overflow: "hidden",
  },

  travelCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    width: "100%",
  },

  providerBlock: {
    flex: 1,
    minWidth: 0,
  },

  providerName: {
    color: theme.colors.primary,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "900",
    flexShrink: 1,
  },

  transportType: {
    color: theme.colors.textMuted,
    marginTop: 3,
    fontSize: 13,
    fontWeight: "800",
  },

  travelPrice: {
    color: theme.colors.primary,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    flexShrink: 0,
    maxWidth: 95,
    textAlign: "right",
  },

  travelInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },

  travelInfoBlock: {
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: 12,
    padding: 12,
    minWidth: 130,
    flexGrow: 1,
    flexBasis: 130,
  },

  travelInfoLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },

  travelInfoValue: {
    color: theme.colors.text,
    marginTop: 4,
    fontSize: 15,
    fontWeight: "900",
  },

  travelNotes: {
    color: theme.colors.textMuted,
    marginTop: 12,
    lineHeight: 21,
  },

  cardActionButton: {
    marginTop: 16,
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },

  cardActionButtonText: {
    color: "#ffffff",
    fontWeight: "900",
  },

  bestTimeCard: {
    marginTop: 6,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
  },

  bestTimeTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  bestTimeTitle: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: "900",
  },

  bestTimeText: {
    color: theme.colors.textMuted,
    marginTop: 4,
  },

  bestTimePricePill: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  bestTimePrice: {
    color: "#ffffff",
    fontWeight: "900",
  },

  accommodationIntro: {
    alignItems: "center",
    marginTop: 34,
    marginBottom: 20,
  },

  accommodationTitle: {
    color: theme.colors.primary,
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "900",
    textAlign: "center",
  },

  accommodationSubtitle: {
    color: theme.colors.text,
    marginTop: 8,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
    textAlign: "center",
  },

  accommodationArea: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
  },

  filterPanel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 16,
  },

  filterTitle: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },

  accommodationResults: {
    gap: 14,
  },

  resultsCount: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "800",
  },

  noResultsBox: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 18,
  },

  noResultsTitle: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: "900",
  },

  noResultsText: {
    color: theme.colors.textMuted,
    marginTop: 6,
    lineHeight: 22,
  },

  accommodationCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    gap: 14,
    padding: 14,
  },

  accommodationImage: {
    height: 132,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSoft,
  },

  accommodationDetails: {
    flex: 1,
    minWidth: 0,
  },

  hotelName: {
    color: theme.colors.primary,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
  },

  hotelMeta: {
    color: theme.colors.text,
    marginTop: 6,
    fontSize: 13,
    fontWeight: "800",
  },

  hotelLocation: {
    color: theme.colors.textMuted,
    marginTop: 6,
    fontSize: 13,
  },

  perkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },

  perkPill: {
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  perkText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
  },

  priceColumn: {
    minWidth: 130,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  hotelPrice: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: "900",
  },

  hotelTotal: {
    color: theme.colors.textMuted,
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
  },

  dealButton: {
    marginTop: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  dealButtonText: {
    color: "#ffffff",
    fontWeight: "900",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20, 5, 25, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  modalCard: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "80%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  modalHeader: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  modalTitle: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: "900",
    flex: 1,
  },

  modalCloseButton: {
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  modalCloseText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "900",
  },

  modalOptionsScroll: {
    maxHeight: 440,
  },

  modalOption: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  modalOptionSelected: {
    backgroundColor: theme.colors.surfaceSoft,
  },

  modalOptionText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },

  modalOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: "900",
  },

  modalOptionCheck: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: "900",
  },
});