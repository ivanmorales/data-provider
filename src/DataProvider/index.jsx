import { QueryClientProvider } from "@tanstack/react-query";

export const DataProvider = ({ children, client }) => {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
