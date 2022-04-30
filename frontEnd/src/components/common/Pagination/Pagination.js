import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    CardFooter,
    Pagination,
    PaginationItem,
    PaginationLink,
    
  } from "reactstrap";

  import i18next from "i18next";

class ManulPagination extends Component {
    constructor(props) {
        super(props);

    }

    render() {
        const { total, currentPage } = this.props;
        let pageLinks = [];
        let numberOfPages = 0;
        if (total % 10 === 0) {
            numberOfPages = Math.floor(total / 10);
        } else {
            numberOfPages = Math.floor(total / 10) + 1;
        }
        for (let i = 1; i <= numberOfPages; i++) {
            pageLinks.push(i);
        }
        let lowerPage = currentPage - 3;
        let upperPage = currentPage + 3;
        return (

            <CardFooter className="py-4">
                <nav aria-label="...">
                    <Pagination
                        className="pagination justify-content-end mb-0"
                        listClassName="justify-content-end mb-0"
                    >
                        <PaginationItem
                            disabled={currentPage === 1 ? true : false}
                        >
                            <PaginationLink
                                onClick={this.props.handlePagePrev}
                                tabIndex="-1"
                            >
                                <i className="fas fa-angle-left" />
                                <span className="sr-only">{i18next.t("Previous")}</span>
                            </PaginationLink>
                        </PaginationItem>

                        {
                            pageLinks.map((num, i) => {
                                if (currentPage <= 8) {
                                    if (i >= 0 && i <= 9) {
                                        return (
                                            <PaginationItem
                                                active={currentPage === num}
                                            >
                                                <PaginationLink
                                                    onClick={() => {
                                                        this.props.handlePageNum(num);
                                                    }}
                                                >
                                                    {num}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    }
                                    else if (num === 11) {
                                        return (
                                            <PaginationItem disabled={true}>
                                                <PaginationLink >
                                                    ...
                                                </PaginationLink>
                                            </PaginationItem>
                                        )
                                    }
                                    else if (num === pageLinks.length) {
                                        return (
                                            <PaginationItem
                                                active={currentPage === num}
                                            >
                                                <PaginationLink
                                                    onClick={() => {
                                                        this.props.handlePageNum(num);
                                                    }}
                                                >
                                                    {num}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    }
                                } else {
                                    if (num >= 0 && num <= 2) {
                                        return (
                                            <PaginationItem
                                                active={currentPage === num}
                                            >
                                                <PaginationLink
                                                    onClick={() => {
                                                        this.props.handlePageNum(num);
                                                    }}
                                                >
                                                    {num}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    } else if (i == 2) {
                                        return (
                                            <PaginationItem disabled={true}>
                                                <PaginationLink >
                                                    ...
                          </PaginationLink>
                                            </PaginationItem>
                                        )
                                    }
                                    else if (i + 1 >= lowerPage && i + 1 <= upperPage) {
                                        return (
                                            <PaginationItem
                                                active={currentPage === num}
                                            >
                                                <PaginationLink
                                                    onClick={() => {
                                                        this.props.handlePageNum(num);
                                                    }}
                                                >
                                                    {num}
                                                </PaginationLink>
                                            </PaginationItem>
                                        )
                                    } else if (upperPage + 1 === i) {
                                        return (
                                            <PaginationItem disabled={true}>
                                                <PaginationLink >
                                                    ...
                          </PaginationLink>
                                            </PaginationItem>
                                        )
                                    }
                                    else if (i === pageLinks.length - 1 || i === pageLinks.length - 2) {
                                        return (
                                            <PaginationItem
                                                active={currentPage === num}
                                            >
                                                <PaginationLink
                                                    onClick={() => {
                                                        this.props.handlePageNum(num);
                                                    }}
                                                >
                                                    {num}
                                                </PaginationLink>
                                            </PaginationItem>
                                        )
                                    }
                                }
                            })
                        }
                        <PaginationItem
                            disabled={
                                numberOfPages - currentPage === 0
                                    ? true
                                    : false
                            }
                        >
                            <PaginationLink onClick={this.props.handlePageNext}>
                                <i className="fas fa-angle-right" />
                                <span className="sr-only">{i18next.t("Next")}</span>
                            </PaginationLink>
                        </PaginationItem>
                    </Pagination>
                </nav>
            </CardFooter>

        );
    }
}
export default ManulPagination;