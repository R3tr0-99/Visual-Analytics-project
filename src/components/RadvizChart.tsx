import d3 from "d3";
import { useEffect } from "react";
import { Fragment } from "react/jsx-runtime";

export default function RadvizChart() {

    useEffect(() => {
        // @ts-ignore
        var radviz = d3.radviz();
    }, [])

    return (
        <Fragment>
        </Fragment>
    )
}