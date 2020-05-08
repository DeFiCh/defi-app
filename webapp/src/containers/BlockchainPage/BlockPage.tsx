import React, { Component } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { Button, Row, Col } from "reactstrap";
import { MdArrowBack, MdChevronLeft, MdChevronRight } from "react-icons/md";
import { NavLink, RouteComponentProps } from "react-router-dom";
import KeyValueLi from "../../components/KeyValueLi/KeyValueLi";
import BlockTxn from "./BlockTxn";
import { I18n } from "react-redux-i18n";
import { fetchTxnsRequest } from "./reducer";

interface BlockPageProps {
  txns: Array<{
    hash: string;
    time: string;
    froms: Array<{
      address: string;
      amount: number;
    }>;
    tos: Array<{
      address: string;
      amount: number;
    }>;
  }>;
  fetchTxns: Function;
}

interface BlockPageState {
  txns: Array<{
    hash: string;
    time: string;
    froms: Array<{
      address: string;
      amount: number | string;
    }>;
    tos: Array<{
      address: String;
      amount: number | string;
    }>;
  }>;
}

interface RouteParams {
  id?: string;
  height?: string;
}

class BlockPage extends Component<
  BlockPageProps & RouteComponentProps<RouteParams>,
  BlockPageState
> {
  componentDidMount = () => {
    this.props.fetchTxns();
  };

  render() {
    return (
      <div className="main-wrapper">
        <Helmet>
          <title>
            {I18n.t("containers.blockChainPage.blockPage.title", {
              blockNo: this.props.match.params.height,
            })}
          </title>
        </Helmet>
        <header className="header-bar">
          <Button
            to="/blockchain"
            tag={NavLink}
            color="link"
            className="header-bar-back"
          >
            <MdArrowBack />
            <span className="d-lg-inline">
              {I18n.t("containers.blockChainPage.blockPage.blockchain")}
            </span>
          </Button>
          <h1>
            {I18n.t("containers.blockChainPage.blockPage.block")}&nbsp;
            {this.props.match.params.height}
          </h1>
        </header>
        <div className="content">
          <section className="mb-5">
            <Row className="mb-4">
              <Col md="6">
                <KeyValueLi
                  label={I18n.t(
                    "containers.blockChainPage.blockPage.noOfTransactions"
                  )}
                  value="2851"
                />
              </Col>
              <Col md="6">
                <KeyValueLi
                  label={I18n.t(
                    "containers.blockChainPage.blockPage.difficulty"
                  )}
                  value="13798783827516.416"
                />
              </Col>
              <Col md="6">
                <KeyValueLi
                  label={I18n.t("containers.blockChainPage.blockPage.height")}
                  value={this.props.match.params.height}
                />
              </Col>
              <Col md="6">
                <KeyValueLi
                  label={I18n.t("containers.blockChainPage.blockPage.bits")}
                  value="171465f2"
                />
              </Col>
              <Col md="6">
                <KeyValueLi
                  label={I18n.t(
                    "containers.blockChainPage.blockPage.blockReward"
                  )}
                  value="12.5 DFI"
                />
              </Col>
              <Col md="6">
                <KeyValueLi
                  label={I18n.t("containers.blockChainPage.blockPage.version")}
                  value="21073676288"
                />
              </Col>
              <Col md="6">
                <KeyValueLi
                  label={I18n.t("containers.blockChainPage.blockPage.minedBy")}
                  value="Miner A"
                />
              </Col>
              <Col md="6">
                <KeyValueLi
                  label={I18n.t("containers.blockChainPage.blockPage.nonce")}
                  value="353942907"
                />
              </Col>
              <Col>
                <KeyValueLi
                  label={I18n.t(
                    "containers.blockChainPage.blockPage.blockHash"
                  )}
                  value="00000000000000000003e1bee7555dd5ecfb2d54eaca0650d426e10f640b7f89"
                  copyable="true"
                />
              </Col>
              <Col>
                <KeyValueLi
                  label={I18n.t(
                    "containers.blockChainPage.blockPage.merkleRoot"
                  )}
                  value="2c5030ae78f6201d76f20baf77a3e3"
                  copyable="true"
                />
              </Col>
            </Row>
            <div className="d-flex justify-content-between">
              <Button
                to={`/blockchain/block/${
                  Number.parseInt(this.props.match.params.height!) - 1
                }`}
                tag={NavLink}
                color="outline-primary"
                className="header-bar-back"
              >
                <MdChevronLeft />
                <span className="d-lg-inline">
                  {Number.parseInt(this.props.match.params.height!) - 1}
                </span>
              </Button>
              <Button
                to={`/blockchain/block/${
                  Number.parseInt(this.props.match.params.height!) + 1
                }`}
                tag={NavLink}
                color="outline-primary"
                className="header-bar-back"
              >
                <span className="d-lg-inline">
                  {Number.parseInt(this.props.match.params.height!) + 1}
                </span>
                <MdChevronRight />
              </Button>
            </div>
          </section>
          <section>
            <h2>
              {I18n.t("containers.blockChainPage.blockPage.transactions")}
            </h2>
            <div>
              {this.props.txns.map((txn) => (
                <BlockTxn txn={txn} />
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const { txns, isTxnsLoaded, isLoadingTxns, TxnsLoadError } = state.blockchain;
  return {
    txns,
    isTxnsLoaded,
    isLoadingTxns,
    TxnsLoadError,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    fetchTxns: () => dispatch(fetchTxnsRequest()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(BlockPage);