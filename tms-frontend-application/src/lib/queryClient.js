import { QueryClient } from '@tanstack/react-query';


const queryClient = new QueryClient({
defaultOptions: {
queries: {
refetchOnWindowFocus: false,
staleTime: 10_000,
retry: 1
}
}
});


export default queryClient;