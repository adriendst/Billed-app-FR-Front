/**
 * @jest-environment jsdom
 */

import { fireEvent, getByTestId, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { bills } from "../fixtures/bills"
import { log } from 'console'
import mockStore from "../__mocks__/store"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import router from "../app/Router"
import BillsUI from "../views/BillsUI.js"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then newBill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "e@e"
      }))

      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const windowIcon = screen.getByTestId("icon-mail");

      expect(windowIcon.className).toBe("active-icon");
    });
    test("Then I upload my file", async () => {


      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "e@e"
      }))
      const html = NewBillUI()
      document.body.innerHTML = html
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const store = null
      let newBill = new NewBill({
        document, onNavigate, store, bills : mockStore, localStorage: window.localStorage
      })

      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);

      const fileInput = screen.getByTestId('file')
      fileInput.addEventListener('change', handleChangeFile);

      const fileImage = 'image.png'
      const file = new File(['(⌐□_□)'], fileImage, { type: 'image/png' })

      fireEvent.change(fileInput, {
        target: { files: [file] },
      })

      expect(handleChangeFile).toBeCalled();

    })

  })


  //test d'intégration POST
  describe('When I create a new bill', () => {
    test("Then I post my bill", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.spyOn(newBill, "handleSubmit");
      const form = screen.getByTestId("form-new-bill");
      const btnSubmitForm = form.querySelector("#btn-send-bill");

      fireEvent.change(screen.getByTestId("expense-type"), {
        target: { value: 'Transport' },
      });
      fireEvent.change(screen.getByTestId("expense-name"), {
        target: { value: 'Avion' },
      });
      fireEvent.change(screen.getByTestId("datepicker"), {
        target: { value: '24-04-2024' },
      });
      fireEvent.change(screen.getByTestId("amount"), {
        target: { value: '26' },
      });
      fireEvent.change(screen.getByTestId("vat"), {
        target: { value: '56' },
      });
      fireEvent.change(screen.getByTestId("pct"), {
        target: { value: '4' },
      });
      fireEvent.change(screen.getByTestId("commentary"), {
        target: { value: 'vol metz - nîmes' },
      });

      form.addEventListener("submit", (e) => newBill.handleSubmit(e));
      fireEvent.click(btnSubmitForm);

      expect(handleSubmit).toHaveBeenCalled();
    })
  })
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "e@e",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });
    test("fetche bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      document.body.innerHTML = BillsUI({ error: "Erreur 404" });
      const message = screen.getByText("Erreur 404");
      expect(message).toBeTruthy();
    });

    test("fetche bills from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });
      document.body.innerHTML = BillsUI({ error: "Erreur 500" });
      const message = screen.getByText("Erreur 500");
      expect(message).toBeTruthy();
    });
  });

})
