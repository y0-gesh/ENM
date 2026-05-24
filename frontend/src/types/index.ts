export type Role = 'USER' | 'PROVIDER';

export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  bio: string;
  serviceCategory: string;
  serviceRadius: number;
  latitude: number;
  longitude: number;
  avgRating: number;
  completedJobs: number;
  score: number;
  isAvailable: boolean;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
  reviews?: Review[];
}

export interface Booking {
  id: string;
  userId: string;
  providerId: string;
  status: BookingStatus;
  scheduledAt: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  provider: ProviderProfile;
  review?: Review;
}

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  providerId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer?: {
    name: string;
  };
}

export interface NearbyProvider extends ProviderProfile {
  distance: number;
  name: string;
  email: string;
}
