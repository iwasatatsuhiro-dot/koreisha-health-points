import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';

export default function Index() {
  const { kkpId, role, termsAcceptedAt } = useAuthStore();

  if (!termsAcceptedAt) return <Redirect href="/(auth)/welcome" />;
  if (!kkpId) return <Redirect href="/(auth)/register" />;
  if (role === 'organizer') return <Redirect href="/(organizer)/home" />;
  return <Redirect href="/(user)/home" />;
}
