import { useAppDispatch, useAppSelector } from "./hooks";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { setAlertModal } from "./state/slices/application";
import classes from "./App.module.css";
import "../src/css/globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import AlertModal from "./components/Modal";
import Footer from "./components/Footer";
import NotFoundPage from "./pages/NotFound";
import Playground from "./pages/Playground";
import relativeTime from "dayjs/plugin/relativeTime";
import { AvatarProvider } from "@davatar/react";
import dayjs from "dayjs";

function App() {
  const dispatch = useAppDispatch();
  dayjs.extend(relativeTime);

  const alertModal = useAppSelector((state) => state.application.alertModal);

  return (
    <div className={`${classes.wrapper}`}>
      {alertModal.show && (
        <AlertModal
          title={alertModal.title}
          content={<p>{alertModal.message}</p>}
          onDismiss={() =>
            dispatch(setAlertModal({ ...alertModal, show: false }))
          }
        />
      )}
      <BrowserRouter>
        <AvatarProvider provider={undefined} batchLookups={true}>
          <Switch>
            <Route exact path="/" component={Playground} />
            <Route component={NotFoundPage} />
          </Switch>
          <Footer />
        </AvatarProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
