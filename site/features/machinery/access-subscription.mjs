// Discard old callbacks and pending imports whenever the authenticated access changes.
export function subscribeMachineAccess({subscribePublic, loadAdmin, onData, onError, onReset}) {
  let revision = 0;
  let isAdmin = false;
  let disposed = false;
  let unsubscribe = () => {};
  const connect = (subscribe, version) => {
    unsubscribe = subscribe(
      (machines) => { if (!disposed && version === revision) onData(machines); },
      (error) => { if (!disposed && version === revision) onError(error); }
    );
  };
  connect(subscribePublic, revision);
  return {
    async setAdmin(nextAdmin) {
      if (disposed || nextAdmin === isAdmin) return;
      const version = ++revision;
      unsubscribe();
      isAdmin = nextAdmin;
      onReset(nextAdmin);
      try {
        const subscribe = nextAdmin ? await loadAdmin() : subscribePublic;
        if (!disposed && version === revision) connect(subscribe, version);
      } catch (error) {
        if (!disposed && version === revision) onError(error);
      }
    },
    dispose() { disposed = true; revision++; unsubscribe(); },
  };
}
