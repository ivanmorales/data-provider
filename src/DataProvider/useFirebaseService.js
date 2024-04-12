import { initializeApp } from "firebase/app";
import { query, ref, getDatabase, onValue, limitToFirst } from "firebase/database";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASEURL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECTID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGEBUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGINGSENDERID,
  appId: import.meta.env.VITE_FIREBASE_APPID,
};

const _buildFilters = ({ limit }) => {
  const filters = []

  if(limit) filters.push(limitToFirst(limit))

  return filters
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export const useFirebaseService = (keys = [], { limit, path, subscribe = false }) => {
  const queryClient = useQueryClient();
  const queryKey = ["firebaseService", ...keys];

  const dbRef = ref(database, path);

  const filters = _buildFilters({ limit })

  const firebaseQuery = query(dbRef, ...filters)

  useEffect(() => {
    return onValue(
      firebaseQuery,
      (snapshot) => {
        const data = snapshot.val();

        queryClient.setQueryData(queryKey, (cacheData) => ({
          ...cacheData,
          data,
        }));
      },
      { onlyOnce: !subscribe }
    );
  }, [firebaseQuery, subscribe, limit]);

  return useQuery({ queryKey });
};
