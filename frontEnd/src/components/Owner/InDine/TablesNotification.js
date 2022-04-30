import React from "react";

// reactstrap components
import { Card, CardBody, CardTitle, Container, Row, Col, Table } from "reactstrap";
import { Header, Popup, Grid } from 'semantic-ui-react'


class TablesNotification extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      stateCard: [],
    };
  }
  
  PopMessage = (tableData,msgIndex) => {
    this.props.PopMessage(tableData,msgIndex)
  }
  
  render() {
    return (
      <>
        <Container className="pb-5" fluid>
          <div className="header-body">
            {/* Card stats */}
            <Row>
              {this.props.states.map((state, index) => {
                return (
                  <Col lg="6" xl="3" md="6" sm="6" xs="12" className="p-3">
                    <Card className="card-stats mb-4 mb-xl-0">
                      <CardBody>
                        <Row>
                          <div className="col">
                            <CardTitle
                              tag="h5"
                              className="text-uppercase text-muted mb-0"
                            >
                              {"Table "}{state.cardTitle}
                            </CardTitle>
                            <span className="h2 font-weight-bold mb-0">
                              {
                                state.messages.length === 0 ? <i class="fas fa-tasks text-gray"></i>
                                  : <>
                                    <Popup trigger={
                                      <i className="fas fa-tasks text-green mr-2"
                                        style={{ cursor: "pointer" }}
                                      >
                                      </i>
                                    }
                                      flowing hoverable >
                                      <Table className="display-2">

                                        {
                                          state.messages.map((msg,i) => {
                                            return (
                                              <>
                                                <tr >
                                                  <th>
                                                    <i className="fas fa-drumstick-bite text-info" ></i>
                                                  </th>
                                                  <th>
                                                    {msg}
                                                  </th>
                                                  <th>
                                                  <i className="fas fa-check text-green" 
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => {this.PopMessage(state,i)}}  
                                                  ></i>
                                                    {/* <i class="fas fa-check-circle text-green" ></i> */}
                                                  </th>
                                                </tr>
                                              </>
                                            )
                                          })
                                        }
                                      </Table>
                                    </Popup>
                                    {/* <i className="fas fa-tasks text-green mr-2" ></i> */}
                                    {state.state_value}
                                  </>
                              }

                            </span>
                          </div>
                          <Col className="col-auto">
                            <div
                              className={`icon icon-shape rounded-circle shadow`}
                            >
                              {state.messages.length === 0 ? <i className="fas fa-bell text-gray"></i>
                                : <i className="fas fa-bell text-red"></i>
                              }
                            </div>
                          </Col>
                        </Row>
                      </CardBody>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        </Container>
      </>
    );
  }
}

export default TablesNotification;
