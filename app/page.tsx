import { AuthGate } from "./AuthGate";
import { FirebaseProvider } from "./FirebaseProvider";
import HandoverApp from "./HandoverApp";

export default function Home() {
  return (
    <FirebaseProvider>
      <AuthGate>
        <HandoverApp />
      </AuthGate>
    </FirebaseProvider>
  );
}
