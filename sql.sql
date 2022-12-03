SELECT e.first_name, e.last_name, s.from_date, s.to_date, s.salary
FROM employees AS e
         JOIN salaries AS s ON e.emp_id = s.emp_id
WHERE e.emp_id = 10012