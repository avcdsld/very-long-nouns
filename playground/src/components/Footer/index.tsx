import classes from "./Footer.module.css";
import { Container } from "react-bootstrap";

const Footer = () => {
  return (
    <div className={classes.wrapper}>
      <Container className={classes.container}>
        <footer className={classes.footerSignature}></footer>
      </Container>
    </div>
  );
};
export default Footer;
