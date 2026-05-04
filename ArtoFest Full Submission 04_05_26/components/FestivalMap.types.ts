export type MappableFestival = {
  id: number;
  name: string;
  city: string;
  country: string;
  artForm: string;
  latitude: number;
  longitude: number;
};

export type FestivalMapProps = {
  festivals: MappableFestival[];
  selectedCountry: string;
};