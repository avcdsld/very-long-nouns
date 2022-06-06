import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { ChainId, DAppProvider } from "@usedapp/core";
import account from "./state/slices/account";
import application from "./state/slices/application";
import logs from "./state/slices/logs";
import { ApolloProvider } from "@apollo/client";
import { clientFactory } from "./wrappers/subgraph";
import config, { CHAIN_ID, createNetworkHttpUrl } from "./config";
import dotenv from "dotenv";
import { connectRouter, routerMiddleware } from "connected-react-router";
import { createBrowserHistory, History } from "history";
import {
  applyMiddleware,
  createStore,
  combineReducers,
  PreloadedState,
} from "redux";
import { Provider } from "react-redux";
import { composeWithDevTools } from "redux-devtools-extension";
import { LanguageProvider } from "./i18n/LanguageProvider";

dotenv.config();

export const history = createBrowserHistory();

const createRootReducer = (history: History) =>
  combineReducers({
    router: connectRouter(history),
    account,
    application,
    logs,
  });

export default function configureStore(preloadedState: PreloadedState<any>) {
  const store = createStore(
    createRootReducer(history), // root reducer with router state
    preloadedState,
    composeWithDevTools(
      applyMiddleware(
        routerMiddleware(history) // for dispatching history actions
        // ... other middlewares ...
      )
    )
  );

  return store;
}

const store = configureStore({});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

const supportedChainURLs = {
  [ChainId.Mainnet]: createNetworkHttpUrl("mainnet"),
  [ChainId.Rinkeby]: createNetworkHttpUrl("rinkeby"),
  [ChainId.Hardhat]: "http://localhost:8545",
};

// prettier-ignore
const useDappConfig = {
  readOnlyChainId: CHAIN_ID,
  readOnlyUrls: {
    [CHAIN_ID]: supportedChainURLs[CHAIN_ID],
  },
};

const client = clientFactory(config.app.subgraphApiUri);

ReactDOM.render(
  <Provider store={store}>
    <ApolloProvider client={client}>
      <DAppProvider config={useDappConfig}>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </DAppProvider>
    </ApolloProvider>
  </Provider>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
