import { Col, Image } from "react-bootstrap";
import classes from "./NotFound.module.css";
import _404img from "../../assets/404noun.png";

const NotFoundPage = () => {
  return (
    <>
      <Col lg={4}>
        <Image src={_404img} fluid />
      </Col>
      <Col lg={8}>
        <h1 className={classes.heading}>
          404: This is not the person, place, or thing you're looking for...
        </h1>
      </Col>
    </>
  );
};
export default NotFoundPage;
