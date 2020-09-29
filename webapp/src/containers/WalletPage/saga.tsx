import { call, put, takeLatest, select, all } from 'redux-saga/effects';
import * as log from '../../utils/electronLogger';
import {
  fetchPaymentRequest,
  fetchPaymentRequestsSuccess,
  fetchPaymentRequestsFailure,
  fetchWalletTxnsRequest,
  fetchWalletTxnsSuccess,
  fetchWalletTxnsFailure,
  addReceiveTxnsRequest,
  addReceiveTxnsSuccess,
  addReceiveTxnsFailure,
  fetchSendDataFailure,
  fetchSendDataRequest,
  fetchSendDataSuccess,
  fetchWalletBalanceRequest,
  fetchWalletBalanceSuccess,
  fetchWalletBalanceFailure,
  removeReceiveTxnsRequest,
  removeReceiveTxnsSuccess,
  removeReceiveTxnsFailure,
  fetchPendingBalanceRequest,
  fetchPendingBalanceSuccess,
  fetchPendingBalanceFailure,
  stopWalletTxnPagination,
  setBlockChainInfo,
  createWalletFailure,
  createWalletSuccess,
  createWalletRequest,
} from './reducer';
import {
  handelGetPaymentRequest,
  handelAddReceiveTxns,
  handelFetchWalletTxns,
  handleSendData,
  handleFetchWalletBalance,
  handelRemoveReceiveTxns,
  handleFetchPendingBalance,
  getAddressInfo,
  getBlockChainInfo,
  createHDWallet,
} from './service';
import queue from '../../worker/queue';
import store from '../../app/rootStore';
import showNotification from '../../utils/notifications';
import { paginate } from '../../utils/utility';
import { I18n } from 'react-redux-i18n';
import uniqBy from 'lodash/uniqBy';
import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';
import { MAX_WALLET_TXN_PAGE_SIZE, WALLET_PAGE_PATH } from '../../constants';
import PersistentStore from '../../utils/persistentStore';

export function* getNetwork() {
  const {
    blockChainInfo: { chain },
  } = yield select((state) => state.wallet);
  return chain;
}

function fetchWalletBalance() {
  queue.push(
    { methodName: handleFetchWalletBalance, params: [] },
    (err, result) => {
      if (err) {
        showNotification(I18n.t('alerts.walletBalanceFailure'), err.message);
        store.dispatch(fetchWalletBalanceFailure(err.message));
        log.error(err);
        return;
      }
      store.dispatch(fetchWalletBalanceSuccess(result));
    }
  );
}

function fetchPendingBalance() {
  queue.push(
    { methodName: handleFetchPendingBalance, params: [] },
    (err, result) => {
      if (err) {
        showNotification(I18n.t('alerts.pendingBalanceFailure'), err.message);
        store.dispatch(fetchPendingBalanceFailure(err.message));
        log.error(err);
        return;
      }
      store.dispatch(fetchPendingBalanceSuccess(result));
    }
  );
}

function* getPaymentRequestState() {
  const { paymentRequests = [] } = yield select((state) => state.wallet);
  return cloneDeep(paymentRequests);
}

export function* addReceiveTxns(action: any) {
  try {
    const cloneDeepPaymentRequests = yield call(getPaymentRequestState);

    const networkName = yield call(getNetwork);

    yield call(handelAddReceiveTxns, action.payload, networkName);

    cloneDeepPaymentRequests.push(action.payload);

    yield put(addReceiveTxnsSuccess(cloneDeepPaymentRequests));
  } catch (e) {
    showNotification(I18n.t('alerts.addReceiveTxnsFailure'), e.message);
    yield put(addReceiveTxnsFailure(e.message));
    log.error(e);
  }
}

export function* removeReceiveTxns(action: any) {
  try {
    const cloneDeepPaymentRequests = yield call(getPaymentRequestState);

    const networkName = yield call(getNetwork);

    yield call(handelRemoveReceiveTxns, action.payload, networkName);

    const result = cloneDeepPaymentRequests.filter(
      (ele) => ele.id && ele.id.toString() !== action.payload.toString()
    );

    yield put(removeReceiveTxnsSuccess(result));
  } catch (e) {
    showNotification(I18n.t('alerts.removeReceiveTxnsFailure'), e.message);
    yield put(removeReceiveTxnsFailure(e.message));
    log.error(e);
  }
}

export function* fetchPayments() {
  try {
    const networkName = yield call(getNetwork);
    const data = yield call(handelGetPaymentRequest, networkName);
    const list = yield all(
      data.map((item) => call(getAddressInfo, item.address))
    );
    const result = data.filter((item) => {
      const found = list.find(
        (ele) => ele.address === item.address && ele.ismine && !ele.iswatchonly
      );
      return !isEmpty(found);
    });
    yield put(fetchPaymentRequestsSuccess(result));
  } catch (e) {
    showNotification(I18n.t('alerts.paymentRequestsFailure'), e.message);
    yield put({ type: fetchPaymentRequestsFailure.type, payload: e.message });
    log.error(e);
  }
}

function* fetchWalletTxns(action) {
  const { currentPage: pageNo, pageSize, intialLoad } = action.payload;
  const { totalFetchedTxns, walletTxnCount, walletPageCounter } = yield select(
    (state) => state.wallet
  );
  if (totalFetchedTxns.length <= (pageNo - 1) * pageSize || intialLoad) {
    yield put(stopWalletTxnPagination());
    queue.push(
      {
        methodName: handelFetchWalletTxns,
        params: [walletPageCounter, MAX_WALLET_TXN_PAGE_SIZE],
      },
      (err, result) => {
        if (err) {
          store.dispatch(fetchWalletTxnsFailure(err.message));
          log.error(err);
          return;
        }
        if (result && result.walletTxns) {
          const distinct = uniqBy(result.walletTxns, 'txnId');
          const previousFetchedTxns = intialLoad ? [] : totalFetchedTxns;
          const totalFetched = previousFetchedTxns.concat(distinct);
          store.dispatch(
            fetchWalletTxnsSuccess({
              walletTxnCount: result.walletTxnCount,
              totalFetchedTxns: totalFetched,
              walletTxns: paginate(totalFetched, pageSize, pageNo),
              walletPageCounter: intialLoad ? 1 : walletPageCounter + 1,
            })
          );
        } else {
          showNotification(I18n.t('alerts.walletTxnsFailure'), 'No data found');
          store.dispatch(fetchWalletTxnsFailure('No data found'));
        }
      }
    );
  } else {
    yield put(
      fetchWalletTxnsSuccess({
        totalFetchedTxns,
        walletTxnCount,
        walletTxns: paginate(totalFetchedTxns, pageSize, pageNo),
        walletPageCounter,
      })
    );
  }
}

function fetchSendData() {
  queue.push({ methodName: handleSendData, params: [] }, (err, result) => {
    if (err) {
      showNotification(I18n.t('alerts.sendDataFailure'), err.message);
      store.dispatch(fetchSendDataFailure(err.message));
      log.error(err);
      return;
    }
    if (result) store.dispatch(fetchSendDataSuccess({ data: result }));
    else {
      showNotification(I18n.t('alerts.sendDataFailure'), 'No data found');
      store.dispatch(fetchSendDataFailure('No data found'));
    }
  });
}

export function* fetchChainInfo() {
  let result;
  try {
    const data = yield call(getBlockChainInfo);
    result = data;
  } catch (err) {
    log.error(err.message);
    result = {};
  }
  yield put(setBlockChainInfo(result));
}

export function* createWallet(action) {
  try {
    const {
      payload: { mnemonicCode, history },
    } = action;
    yield call(createHDWallet, mnemonicCode);
    yield put({ type: createWalletSuccess.type });
    history.push(WALLET_PAGE_PATH);
  } catch (err) {
    log.error(err.message);
    yield put(createWalletFailure);
  }
}

function* mySaga() {
  yield takeLatest(addReceiveTxnsRequest.type, addReceiveTxns);
  yield takeLatest(removeReceiveTxnsRequest.type, removeReceiveTxns);
  yield takeLatest(fetchPaymentRequest.type, fetchPayments);
  yield takeLatest(fetchWalletTxnsRequest.type, fetchWalletTxns);
  yield takeLatest(fetchSendDataRequest.type, fetchSendData);
  yield takeLatest(fetchWalletBalanceRequest.type, fetchWalletBalance);
  yield takeLatest(fetchPendingBalanceRequest.type, fetchPendingBalance);
  yield takeLatest(createWalletRequest.type, createWallet);
}

export default mySaga;
